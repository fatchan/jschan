'use strict';

const { Posts, Boards, Modlogs } = require(__dirname+'/../../db/')
	, Mongo = require(__dirname+'/../../db/db.js')
	, banPoster = require(__dirname+'/banposter.js')
	, deletePosts = require(__dirname+'/deletepost.js')
	, spoilerPosts = require(__dirname+'/spoilerpost.js')
	, stickyPosts = require(__dirname+'/stickyposts.js')
	, bumplockPosts = require(__dirname+'/bumplockposts.js')
	, lockPosts = require(__dirname+'/lockposts.js')
	, cyclePosts = require(__dirname+'/cycleposts.js')
	, deletePostsFiles = require(__dirname+'/deletepostsfiles.js')
	, reportPosts = require(__dirname+'/reportpost.js')
	, dismissReports = require(__dirname+'/dismissreport.js')
	, movePosts = require(__dirname+'/moveposts.js')
	, { remove } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, getAffectedBoards = require(__dirname+'/../../helpers/affectedboards.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, buildQueue = require(__dirname+'/../../queue.js')
	, { postPasswordSecret } = require(__dirname+'/../../configs/secrets.js')
	, threadRegex = /\/[a-z0-9]+\/(?:manage\/)?thread\/(\d+)\.html/i
	, { createHash, timingSafeEqual } = require('crypto');

module.exports = async (req, res, next) => {

	let redirect = req.headers.referer;
	if (!redirect) {
		if (!req.params.board) {
			redirect = '/globalmanage/recent.html';
		} else {
			redirect = `/${req.params.board}/${req.path.endsWith('modactions') ? 'manage/reports' : 'index'}.html`;
		}
	}

	//if user isnt staff, and they put an action that requires password, e.g. delete/spoiler, then filter posts to only matching password
	if (res.locals.permLevel >= 4 && res.locals.actions.numPasswords > 0) {
		let passwordPosts = [];
		if (req.body.postpassword && req.body.postpassword.length > 0) {
			//hash their input and make it a buffer
			const inputPasswordHash = createHash('sha256').update(postPasswordSecret + req.body.postpassword).digest('base64');
			const inputPasswordBuffer = Buffer.from(inputPasswordHash);
			passwordPosts = res.locals.posts.filter(post => {
				if (post.password != null) { //null password doesnt matter for timing attack, it cant be deleted by non-staff
					const postBuffer = Buffer.from(post.password);
					//returns true and passes filter if passwod matched. constant time compare
					return timingSafeEqual(inputPasswordBuffer, postBuffer);
				}
			});
		}
		//no posts matched password, reject
		if (passwordPosts.length === 0) {
			return dynamicResponse(req, res, 403, 'message', {
				'title': 'Forbidden',
				'error': 'Password did not match any selected posts',
				redirect,
			});
		}
		res.locals.posts = passwordPosts;
	}

	//affected boards, list and page numbers
	const deleting = req.body.delete || req.body.delete_ip_board || req.body.delete_ip_global || req.body.delete_ip_thread;
	let { boardThreadMap, beforePages, threadBoards } = await getAffectedBoards(res.locals.posts, deleting);

	if (deleting
		&& req.params.board
		&& req.headers.referer
		&& boardThreadMap[req.params.board]) {
		const threadRefMatch = req.headers.referer.match(threadRegex);
		if (threadRefMatch && boardThreadMap[req.params.board].directThreads.has(+threadRefMatch[1])) {
			redirect = `/${req.params.board}/${req.path.endsWith('modactions') ? 'manage/' : ''}index.html`;
		}
	}

	const messages = [];
	const modlogActions = []
	const combinedQuery = {};
	let aggregateNeeded = false;
	// if getting global banned, board ban doesnt matter
	if (req.body.ban || req.body.global_ban || req.body.report_ban || req.body.global_report_ban) {
		const { message, action, query } = await banPoster(req, res, next);
		if (req.body.ban) {
			modlogActions.push('Ban');
		} else if (req.body.global_ban) {
			modlogActions.push('Global Ban');
		}
		if (req.body.report_ban) {
			modlogActions.push('Ban reporter');
		} else if (req.body.global_report_ban) {
			modlogActions.push('Global ban reporter');
		}
		if (action) {
			combinedQuery[action] = { ...combinedQuery[action], ...query}
		}
		messages.push(message);
	}
	if (deleting) {
		if (res.locals.permLevel >= 4) {
			//delete protection. this could only be single board actions obvously with permLevel >=4
			const { deleteProtectionAge, deleteProtectionCount } = res.locals.board.settings;
			if (deleteProtectionAge > 0 || deleteProtectionCount > 0) {
				const protectedThread = res.locals.posts.some(p => {
					return p.thread === null //is a thread
						&& ((deleteProtectionCount > 0 && p.replyposts > deleteProtectionCount) //and it has more replies than the protection count
							|| (deleteProtectionAge > 0 && new Date() > new Date(p.date.getTime() + deleteProtectionAge))); //or was created too long ato
				});
				if (protectedThread === true) {
					//alternatively, the above .some() could become a filter like some other options and silently not delete,
					//but i think in this case it would be important to notify the user that their own thread(s) cant be deleted yet
					return dynamicResponse(req, res, 403, 'message', {
						'title': 'Forbidden',
						'error': 'You cannot delete old threads or threads with too many replies',
						redirect,
					});
				}
			}
		}
		const postsBefore = res.locals.posts.length;
		if (req.body.delete_ip_board || req.body.delete_ip_global || req.body.delete_ip_thread) {
			const deletePostIps = res.locals.posts.map(x => x.ip.single);
			const deletePostMongoIds = res.locals.posts.map(x => x._id)
			let query = {
				'_id': {
					'$nin': deletePostMongoIds
				},
				'ip.single': {
					'$in': deletePostIps
				}
			};
			if (req.body.delete_ip_thread) {
				const ips_threads = [...boardThreadMap[req.params.board].threads];
				query['board'] = req.params.board;
				query['$or'] = [
					{
						'thread': {
							'$in': ips_threads
						}
					},
					{
						'postId': {
							'$in': ips_threads
						}
					}
				];
			} else if (req.body.delete_ip_board) {
				query['board'] = req.params.board;
			}
			const deleteIpPosts = await Posts.db.find(query).toArray();
			res.locals.posts = res.locals.posts.concat(deleteIpPosts);
		}
		if (res.locals.posts.length > postsBefore) {
			//recalc for extra fetched posts
			const updatedAffected = await getAffectedBoards(res.locals.posts, deleting);
			boardThreadMap = updatedAffected.boardThreadMap;
			beforePages = updatedAffected.beforePages;
			threadBoards = updatedAffected.threadBoards;
		}
		if (req.body.delete_file) {
			const { message } = await deletePostsFiles(res.locals.posts, false); //delete files, not just unlink
			messages.push(message);
		}
		const { action, message } = await deletePosts(res.locals.posts, req.body.delete_ip_global ? null : req.params.board);
		messages.push(message);
		if (action) {
			if (req.body.delete) {
				modlogActions.push('Delete');
			} else if (req.body.delete_ip_board) {
				modlogActions.push('Delete by IP');
			} else if (req.body.delete_ip_global) {
				modlogActions.push('Global delete by IP');
			}
			aggregateNeeded = true;
		}
	} else if (req.body.move) {
		if (boardThreadMap[req.params.board].directThreads.size > 0) {
			const threadIds = [...boardThreadMap[req.params.board].directThreads];
			const fetchMovePosts = await Posts.db.find({
				'board': req.params.board,
				'thread': {
					'$in': threadIds
				}
			}).toArray();
			res.locals.posts = res.locals.posts.concat(fetchMovePosts);
		}
		const { message, action } = await movePosts(req, res);
		if (action) {
			modlogActions.push('Moved');
			aggregateNeeded = true;
		}
		messages.push(message);
	} else {
		// if it was getting deleted/moved, dont do these actions
		if (req.body.unlink_file || req.body.delete_file) {
			const { message, action, query } = await deletePostsFiles(res.locals.posts, req.body.unlink_file);
			if (action) {
				if (req.body.unlink_file) {
					modlogActions.push('Unlink files');
				} else if (req.body.delete_file) {
					modlogActions.push('Delete files');
				}
				aggregateNeeded = true;
				combinedQuery[action] = { ...combinedQuery[action], ...query}
			}
			messages.push(message);
		} else if (req.body.spoiler) {
			const { message, action, query } = spoilerPosts(res.locals.posts);
			if (action) {
				modlogActions.push('Spoiler files');
				combinedQuery[action] = { ...combinedQuery[action], ...query}
			}
			messages.push(message);
		}
		//lock, sticky, bumplock, cyclic
		if (req.body.bumplock) {
			const { message, action, query } = bumplockPosts(res.locals.posts);
			if (action) {
				modlogActions.push('Bumplock');
				combinedQuery[action] = { ...combinedQuery[action], ...query}
			}
			messages.push(message);
		}
		if (req.body.lock) {
			const { message, action, query } = lockPosts(res.locals.posts);
			if (action) {
				modlogActions.push('Lock');
				combinedQuery[action] = { ...combinedQuery[action], ...query}
			}
			messages.push(message);
		}
		if (req.body.sticky != null) {
			const { message, action, query } = stickyPosts(res.locals.posts, req.body.sticky);
			if (action) {
				modlogActions.push('Sticky');
				combinedQuery[action] = { ...combinedQuery[action], ...query}
			}
			messages.push(message);
		}
		if (req.body.cyclic) {
			const { message, action, query } = cyclePosts(res.locals.posts);
			if (action) {
				modlogActions.push('Cycle');
				combinedQuery[action] = { ...combinedQuery[action], ...query}
			}
			messages.push(message);
		}
		// cannot report and dismiss at same time
		if (req.body.report || req.body.global_report) {
			const { message, action, query } = reportPosts(req, res);
			if (action) {
				//no modlog entry for making reports
				combinedQuery[action] = { ...combinedQuery[action], ...query}
			}
			messages.push(message);
		} else if (req.body.dismiss || req.body.global_dismiss) {
			const { message, action, query } = dismissReports(req, res);
			if (action) {
				if (req.body.dismiss) {
					modlogActions.push('Dismiss reports');
				} else if (req.body.global_dismiss) {
					modlogActions.push('Dismiss global reports');
				}
				combinedQuery[action] = { ...combinedQuery[action], ...query}
			}
			messages.push(message);
		}
	}
	if (Object.keys(combinedQuery).length > 0) {
		await Posts.db.updateMany({
			'_id': {
				'$in': res.locals.posts.map(p => Mongo.ObjectId(p._id))
			}
		}, combinedQuery);
	}

	let buildBoards = {};
	//get all affected boards for templates if necessary. can be multiple boards from global actions
	if (modlogActions.length > 0 || res.locals.actions.numBuild > 0) {
		buildBoards = (await Boards.db.find({
			'_id': {
				'$in': threadBoards
			},
		}).toArray()).reduce((acc, curr) => {
			if (!acc[curr._id]) {
				acc[curr._id] = curr;
			}
			return acc;
		}, buildBoards);
	}

	const parallelPromises = [];

	//modlog
	if (modlogActions.length > 0) {
		const modlog = {};
		const logDate = new Date(); //all events current date
		const message = req.body.log_message || null;
		let logUser;
		if (res.locals.permLevel < 4) { //if staff
			logUser = req.session.user;
		} else {
			logUser = 'Unregistered User';
		}
		for (let i = 0; i < res.locals.posts.length; i++) {
			const post = res.locals.posts[i];
			if (!modlog[post.board]) {
				//per board actions, all actions combined to one event
				modlog[post.board] = {
					showLinks: !deleting,
					postLinks: [],
					actions: modlogActions,
					date: logDate,
					showUser: !req.body.hide_name || logUser === 'Unregistered User' ? true : false,
					message: message,
					user: logUser,
					ip: {
						single: res.locals.ip.single,
						raw: res.locals.ip.raw
					}
				};
			}
			modlog[post.board].postLinks.push({
				postId: post.postId,
				thread: req.body.move ? req.body.move_to_thread : post.thread,
			});
		}
		const modlogDocuments = [];
		for (let i = 0; i < threadBoards.length; i++) {
			const boardName = threadBoards[i];
			const boardLog = modlog[boardName];
			//make it into documents for the db
			modlogDocuments.push({
				...boardLog,
				'board': boardName
			});
		}
		if (modlogDocuments.length > 0) {
			//insert the modlog docs
			await Modlogs.insertMany(modlogDocuments);
			for (let i = 0; i < threadBoards.length; i++) {
				const board = buildBoards[threadBoards[i]];
				buildQueue.push({
					'task': 'buildModLog',
					'options': {
						'board': board,
					}
				});
				buildQueue.push({
					'task': 'buildModLogList',
					'options': {
						'board': board,
					}
				});
			}
		}
	}

	//if there are actions that can cause some rebuilding
	if (res.locals.actions.numBuild > 0) {

		//make it into an OR query for the db
		const queryOrs = [];
		for (let i = 0; i < threadBoards.length; i++) {
			const threadBoard = threadBoards[i];
			//convert this to an array while we are here
			boardThreadMap[threadBoard].threads = [...boardThreadMap[threadBoard].threads];
			boardThreadMap[threadBoard].directThreads = [...boardThreadMap[threadBoard].directThreads];
			queryOrs.push({
				'board': threadBoard,
				'postId': {
					'$in': boardThreadMap[threadBoard].threads
				}
			})
		}

		//fetch threads per board that we only checked posts for
		let threadsEachBoard = [];
		if (queryOrs.length > 0) {
			threadsEachBoard = await Posts.db.find({
				'thread': null,
				'$or': queryOrs
			}).toArray();
		}

		//combine it with what we already had
		const selectedThreads = res.locals.posts.filter(post => post.thread === null)
		threadsEachBoard = threadsEachBoard.concat(selectedThreads)

		//get the oldest and newest thread for each board to determine how to delete
		let threadBounds = threadsEachBoard.reduce((acc, curr) => {
			if (!acc[curr.board] || curr.bumped < acc[curr.board].bumped) {
				acc[curr.board] = { oldest: null, newest: null};
			}
			if (!acc[curr.board].oldest || curr.bumped < acc[curr.board].oldest.bumped) {
				acc[curr.board].oldest = curr;
			}
			if (!acc[curr.board].newest || curr.bumped > acc[curr.board].newest.bumped) {
				acc[curr.board].newest = curr;
			}
			return acc;
		}, {});

		if (aggregateNeeded) {
			//recalculate replies and image counts if necessary
			const selectedPosts = res.locals.posts.filter(p => p.thread !== null);
			if (selectedPosts.length > 0) {
/* ignore
                               let threadOrs = selectedPosts.map(p => ({ board: p.board, postId: p.thread }));
                                let replyOrs = selectedPosts.map(p => ({ board: p.board, thread: p.thread }));
                                const [ threads, threadReplyAggregates] = await Promise.all([
                                        Posts.db.find({ '$or': threadOrs }), //i think this is in threadsEachBoard already
                                        Posts.getThreadAggregates(threadOrs)
                                ]);
*/
                                let replyOrs = selectedPosts.map(p => ({ board: p.board, thread: p.thread }));
				const threadReplyAggregates = await Posts.getThreadAggregates(replyOrs);
				const bulkWrites = [];
				const threads = threadsEachBoard;
				for (let i = 0; i < threads.length; i++) {
					const replyAggregate = threadReplyAggregates.find(ra => ra._id.thread === threads[i].postId && ra._id.board === threads[i].board);
					if (!replyAggregate) {
						//thread no longer has any reply post/files, set to 0 and reset bump date to post date.
						//sage replies and bumplock wouldnt matter in that case
						bulkWrites.push({
							'updateOne': {
								'filter': {
									'postId': threads[i].postId,
									'board': threads[i].board
								},
								'update': {
									'$set': {
										'replyposts': 0,
										'replyfiles': 0,
										'bumped': threads[i].date
									},
								}
							}
						});
						//threadbound already fixed for this
					} else {
						if (replyAggregate.bumped < threadBounds[replyAggregate._id.board].oldest.bumped) {
							threadBounds[replyAggregate._id.board].oldest = { bumped: replyAggregate.bumped };
						} else if (replyAggregate.bumped < threadBounds[replyAggregate._id.board].newest.bumped) {
							threadBounds[replyAggregate._id.board].newest = { bumped: replyAggregate.bumped };
						}
						//use results from first aggregate for threads with replies still existing
						const aggregateSet = {
							'replyposts': replyAggregate.replyposts,
							'replyfiles': replyAggregate.replyfiles,
						}
						if (!threads[i].bumplocked) {
							aggregateSet['bumped'] = replyAggregate.bumped;
						}
						bulkWrites.push({
							'updateOne': {
								'filter': {
									'postId': replyAggregate._id.thread,
									'board': replyAggregate._id.board
								},
								'update': {
									'$set': aggregateSet,
								}
							}
						});
					}
				}
				if (bulkWrites.length > 0) {
					await Posts.db.bulkWrite(bulkWrites);
				}
			}
			//afterwards, fix webring and board list latest post activity now. based on last bump date of a non bumplocked thread
			await Posts.fixLatest(threadBoards);
		}
		for (let i = 0; i < threadBoards.length; i++) {
			const boardName = threadBoards[i];
			const bounds = threadBounds[boardName];
			const board = buildBoards[boardName];
			//rebuild impacted threads
			if (req.body.move) {
				buildQueue.push({
					'task': 'buildThread',
					'options': {
						'threadId': req.body.move_to_thread,
						'board': board,
					}
				});
			}
			for (let j = 0; j < boardThreadMap[boardName].threads.length; j++) {
				buildQueue.push({
					'task': 'buildThread',
					'options': {
						'threadId': boardThreadMap[boardName].threads[j],
						'board': board,
					}
				});
			}
			//refresh any pages affected
			const afterPages = Math.ceil((await Posts.getPages(boardName)) / 10);
			let catalogRebuild = true;
			if ((beforePages[boardName] && beforePages[boardName] !== afterPages) || req.body.move) { //handle moves here since dates would change and not work in old/new page calculations
				if (afterPages < beforePages[boardName]) {
					//amount of pages changed, rebuild all pages and delete  any further pages (if pages amount decreased)
					for (let k = beforePages[boardName]; k > afterPages; k--) {
						//deleting html for pages that no longer should exist
						parallelPromises.push(remove(`${uploadDirectory}/html/${boardName}/${k}.html`));
						parallelPromises.push(remove(`${uploadDirectory}/json/${boardName}/${k}.json`));
					}
				}
				buildQueue.push({
					'task': 'buildBoardMultiple',
					'options': {
						'board': board,
						'startpage': 1,
						'endpage': afterPages,
					}
				});
			} else {
				//number of pages did not change, only possibly building existing pages
				const threadPageOldest = await Posts.getThreadPage(boardName, bounds.oldest);
				const threadPageNewest = bounds.oldest.postId === bounds.newest.postId ? threadPageOldest : await Posts.getThreadPage(boardName, bounds.newest);
				if (deleting) {
					if (boardThreadMap[boardName].directThreads.length === 0) {
						//only deleting posts from threads, so thread order wont change, thus we dont delete all pages after
						buildQueue.push({
							'task': 'buildBoardMultiple',
							'options': {
								'board': board,
								'startpage': threadPageNewest,
								'endpage': threadPageOldest,
							}
						});
					} else {
						//deleting threads, so we delete all pages after
						buildQueue.push({
							'task': 'buildBoardMultiple',
							'options': {
								'board': board,
								'startpage': threadPageNewest,
								'endpage': afterPages,
							}
						});
					}
				} else if (req.body.sticky) { //else if -- if deleting, other actions are not executed/irrelevant
					//rebuild current and newer pages
					buildQueue.push({
						'task': 'buildBoardMultiple',
						'options': {
							'board': board,
							'startpage': 1,
							'endpage': threadPageOldest,
						}
					});
				} else if (req.body.lock || req.body.bumplock || req.body.cyclic || req.body.unlink_file) {
					buildQueue.push({
						'task': 'buildBoardMultiple',
						'options': {
							'board': board,
							'startpage': threadPageNewest,
							'endpage': threadPageOldest,
						}
					});
				} else if (req.body.spoiler || req.body.ban || req.body.global_ban) {
					buildQueue.push({
						'task': 'buildBoardMultiple',
						'options': {
							'board': board,
							'startpage': threadPageNewest,
							'endpage': afterPages,
						}
					});
					if (boardThreadMap[boardName].directThreads.length === 0) {
						catalogRebuild = false;
						//these actions dont affect the catalog tile since not on an OP and dont change reply/image counts
					}
				}
			}
			if (catalogRebuild) {
				//the actions will affect the catalog, so we better rebuild it
				buildQueue.push({
					'task': 'buildCatalog',
					'options': {
						'board': board,
					}
				});
			}
		}
	}

	if (parallelPromises.length > 0) {
		//since queue changes, this just removing old html files
		await Promise.all(parallelPromises);
	}

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'messages': messages,
		redirect,
	});

}
