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
	, buildQueue = require(__dirname+'/../../queue.js')
	, { postPasswordSecret } = require(__dirname+'/../../configs/main.js')
	, { createHash, timingSafeEqual } = require('crypto');

module.exports = async (req, res, next) => {

	const redirect = req.headers.referer || `/${req.params.board ? req.params.board+'/manage/reports' : 'globalmanage/recents'}.html`;

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
			return res.status(403).render('message', {
				'title': 'Forbidden',
				'error': 'Password did not match any selected posts',
				redirect,
			});
		}
		res.locals.posts = passwordPosts
	}

	//affected boards, list and page numbers
	const deleting = req.body.delete || req.body.delete_ip_board || req.body.delete_ip_global || req.body.delete_ip_thread;
	let { boardThreadMap, beforePages, threadBoards } = await getAffectedBoards(res.locals.posts, deleting);

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
		const postsBefore = res.locals.posts.length;
		if (req.body.delete_ip_board || req.body.delete_ip_global || req.body.delete_ip_thread) {
			const deletePostIps = res.locals.posts.map(x => x.ip.single);
			const deletePostMongoIds = res.locals.posts.map(x => x._id)
			let query = {
				'_id': {
					'$nin': deletePostMongoIds
				},
				'ip.hash': {
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
		if (req.body.sticky) {
			const { message, action, query } = stickyPosts(res.locals.posts);
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
			}
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
			logUser = req.session.user.username;
		} else {
			logUser = 'Unregistered User';
		}
		for (let i = 0; i < res.locals.posts.length; i++) {
			const post = res.locals.posts[i];
			if (!modlog[post.board]) {
				//per board actions, all actions combined to one event
				modlog[post.board] = {
					postIds: [],
					actions: modlogActions,
					date: logDate,
					showUser: req.body.show_name || logUser === 'Unregistered User' ? true : false,
					message: message,
					user: logUser,
					ip: res.locals.ip.single,
				};
			}
			//push each post id
			modlog[post.board].postIds.push(post.postId);
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

			//fix latest post timestamp on baords for webring/board list activity
			await Posts.fixLatest(threadBoards);

			//recalculate replies and image counts if necessary
			const selectedPosts = res.locals.posts.filter(p => p.thread !== null);
			if (selectedPosts.length > 0) {
				let threadOrs = selectedPosts.map(p => {
					return {
						board: p.board,
						thread: p.thread
					}
				});
				//get replies, files, bump date, from threads
				const threadAggregates = await Posts.getThreadAggregates(threadOrs);
//TODO: change query to fetch threads and group into bumplocked/normal, and only reset bump date on non-bumplocked and ignore sages
				const bulkWrites = [];
				for (let i = 0; i < threadAggregates.length; i++) {
					const threadAggregate = threadAggregates[i];
					if (threadAggregate.bumped < threadBounds[threadAggregate._id.board].oldest.bumped) {
						threadBounds[threadAggregate._id.board].oldest = { bumped: threadAggregate.bumped };
					} else if (threadAggregate.bumped < threadBounds[threadAggregate._id.board].newest.bumped) {
						threadBounds[threadAggregate._id.board].newest = { bumped: threadAggregate.bumped };
					}
					/*
						note: the aggregate will not return any replies if the thread had no remaining replies (e.g. they are all deleted)
						so here we filter them out of the original list, then afterwards the ones left in the list are set to 0 or the OP post date
					*/
					threadOrs = threadOrs.filter(t => t.thread !== threadAggregate._id.thread && t.board !== threadAggregate._id.board);
					//use results from first aggregate for threads with replies still existing
					bulkWrites.push({
						'updateOne': {
							'filter': {
								'postId': threadAggregate._id.thread,
								'board': threadAggregate._id.board
							},
							'update': {
				  				'$set': {
									'replyposts': threadAggregate.replyposts,
									'replyfiles': threadAggregate.replyfiles,
									'bumped': threadAggregate.bumped
								}
							}
						}
					});
				}
				if (threadOrs.length > 0) {
					const threadOPOrs = threadOrs.map(t => {
						return {
							postId: t.thread,
							board: t.board
						};
					});
					//get post dates of OPS
					const emptyThreadAggregates = await Posts.resetThreadAggregates(threadOPOrs);
					if (emptyThreadAggregates.length > 0) {
						for (let i = 0; i < emptyThreadAggregates.length; i++) {
							const threadAggregate = emptyThreadAggregates[i];
							if (threadAggregate.bumped < threadBounds[threadAggregate.board].oldest.bumped) {
								threadBounds[threadAggregate.board].oldest = { bumped: threadAggregate.bumped };
							} else if (threadAggregate.bumped < threadBounds[threadAggregate.board].newest.bumped) {
								threadBounds[threadAggregate.board].newest = { bumped: threadAggregate.bumped };
							}
							//set them all
							bulkWrites.push({
								'updateOne': {
									'filter': {
										'_id': threadAggregate._id
									},
									'update': {
						  				'$set': {
											'replyposts': threadAggregate.replyposts,
											'replyfiles': threadAggregate.replyfiles,
											'bumped': threadAggregate.bumped
										}
									}
								}
							});
						}
					}
				}
				if (bulkWrites.length > 0) {
					await Posts.db.bulkWrite(bulkWrites);
				}
			}
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

	return res.render('message', {
		'title': 'Success',
		'messages': messages,
		redirect,
	});

}
