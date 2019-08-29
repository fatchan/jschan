'use strict';

const { Posts, Boards, Modlogs } = require(__dirname+'/../../db/')
	, Mongo = require(__dirname+'/../../db/db.js')
	, banPoster = require(__dirname+'/banposter.js')
	, deletePosts = require(__dirname+'/deletepost.js')
	, spoilerPosts = require(__dirname+'/spoilerpost.js')
	, stickyPosts = require(__dirname+'/stickyposts.js')
	, sagePosts = require(__dirname+'/sageposts.js')
	, lockPosts = require(__dirname+'/lockposts.js')
	, cyclePosts = require(__dirname+'/cycleposts.js')
	, deletePostsFiles = require(__dirname+'/deletepostsfiles.js')
	, reportPosts = require(__dirname+'/reportpost.js')
	, dismissReports = require(__dirname+'/dismissreport.js')
	, { remove } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, buildQueue = require(__dirname+'/../../queue.js')
	, { postPasswordSecret } = require(__dirname+'/../../configs/main.json')
	, { createHash, timingSafeEqual } = require('crypto');

module.exports = async (req, res, next) => {

	//if user isnt staff, and they put an action that requires password, e.g. delete/spoiler, then filter posts to only matching password
	if (res.locals.permLevel >= 4 && res.locals.actions.numPasswords > 0) {
		const passwordPosts = [];
		if (req.body.password && req.body.password.length > 0) {
			//hash their input and make it a buffer
			const inputPasswordHash = createHash('sha256').update(postPasswordSecret + req.body.password).digest('base64');
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
				'redirect': `/${req.params.board ? req.params.board+'/' : 'globalmanage.html'}`
			});
		}
		res.locals.posts = passwordPosts
	}

	//get a map of boards to threads affected
	const boardThreadMap = {};
	for (let i = 0; i < res.locals.posts.length; i++) {
		const post = res.locals.posts[i];
		if (!boardThreadMap[post.board]) {
			boardThreadMap[post.board] = {
				'directThreads': false,
				'threads': new Set()
			};
		}
		if (!post.thread) {
			//a thread was directly selected on this board, not just posts. so we handle deletes differently
			boardThreadMap[post.board].directThreads = true;
		}
		const threadId = post.thread || post.postId;
		if (!boardThreadMap[post.board].threads.has(threadId)) {
			boardThreadMap[post.board].threads.add(threadId);
		}
	}

	const beforePages = {};
	const threadBoards = Object.keys(boardThreadMap);
	//get number of pages for each before actions for deleting old pages and changing page nav numbers incase number of pages changes
	if (req.body.delete || req.body.delete_ip_board || req.body.delete_ip_global) {
		await Promise.all(threadBoards.map(async board => {
			beforePages[board] = Math.ceil((await Posts.getPages(board)) / 10);
		}));
	}

	const messages = [];
	const modlogActions = []
	const combinedQuery = {};
	let aggregateNeeded = false;
	// if getting global banned, board ban doesnt matter
	if (req.body.ban || req.body.global_ban || req.body.report_ban || req.body.global_report_ban) {
		const { message, action, query } = await banPoster(req, res, next);
		if (req.body.ban || req.body.global_ban) {
			modlogActions.push(req.body.ban || req.body.global_ban);
		}
		if (req.body.report_ban || req.body.global_report_ban) {
			modlogActions.push(req.body.report_ban || req.body.global_report_ban);
		}
		if (action) {
			combinedQuery[action] = { ...combinedQuery[action], ...query}
		}
		messages.push(message);
	}
	if (req.body.delete || req.body.delete_ip_board || req.body.delete_ip_global) {
		if (req.body.delete_ip_board || req.body.delete_ip_global) {
			const deletePostIps = res.locals.posts.map(x => x.ip);
			let query = {
				'ip': {
					'$in': deletePostIps
				}
			};
			if (req.body.delete_ip_board) {
				query['board'] = req.params.board;
			}
			const deleteIpPosts = await Posts.db.find(query).toArray();
			res.locals.posts = res.locals.posts.concat(deleteIpPosts);
		}
		if (req.body.delete_file) {
			const { message } = await deletePostsFiles(res.locals.posts, false); //delete files, not just unlink
			messages.push(message);
		}
		const { action, message } = await deletePosts(res.locals.posts, req.body.delete_ip_global ? null : req.params.board);
		messages.push(message);
		if (action) {
			modlogActions.push(req.body.delete || req.body.delete_ip_board || req.body.delete_ip_global);
			aggregateNeeded = true;
		}
	} else {
		// if it was getting deleted, we cant do any of these
		if (req.body.unlink_file || req.body.delete_file) {
			const { message, action, query } = await deletePostsFiles(res.locals.posts, req.body.unlink_file);
			if (action) {
				modlogActions.push(req.body.unlink_file || req.body.delete_file);
				aggregateNeeded = true;
				combinedQuery[action] = { ...combinedQuery[action], ...query}
			}
			messages.push(message);
		} else if (req.body.spoiler) {
			const { message, action, query } = spoilerPosts(res.locals.posts);
			if (action) {
				modlogActions.push(req.body.spoiler);
				combinedQuery[action] = { ...combinedQuery[action], ...query}
			}
			messages.push(message);
		}
		//lock, sticky, sage, cyclic
		if (req.body.sage) {
			const { message, action, query } = sagePosts(res.locals.posts);
			if (action) {
				modlogActions.push(req.body.sage);
				combinedQuery[action] = { ...combinedQuery[action], ...query}
			}
			messages.push(message);
		}
		if (req.body.lock) {
			const { message, action, query } = lockPosts(res.locals.posts);
			if (action) {
				modlogActions.push(req.body.lock);
				combinedQuery[action] = { ...combinedQuery[action], ...query}
			}
			messages.push(message);
		}
		if (req.body.sticky) {
			const { message, action, query } = stickyPosts(res.locals.posts);
			if (action) {
				modlogActions.push(req.body.sticky);
				combinedQuery[action] = { ...combinedQuery[action], ...query}
			}
			messages.push(message);
		}
		if (req.body.cyclic) {
			const { message, action, query } = cyclePosts(res.locals.posts);
			if (action) {
				modlogActions.push(req.body.cyclic);
				combinedQuery[action] = { ...combinedQuery[action], ...query}
			}
			messages.push(message);
		}
		// cannot report and dismiss at same time
		if (req.body.report || req.body.global_report) {
			const { message, action, query } = reportPosts(req, res);
			if (action) {
				//no modlog for making reports
				combinedQuery[action] = { ...combinedQuery[action], ...query}
			}
			messages.push(message);
		} else if (req.body.dismiss || req.body.global_dismiss) {
			const { message, action, query } = dismissReports(req, res);
			if (action) {
				modlogActions.push(req.body.dismiss || req.body.global_dismiss);
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
		for (let i = 0; i < res.locals.posts.length; i++) {
			const post = res.locals.posts[i];
			if (!modlog[post.board]) {
				//per board actions, all actions combined to one event
				const logUser = res.locals.permLevel < 4 ? req.session.user.username : 'Unregistered User'
				modlog[post.board] = {
					postIds: [],
					actions: modlogActions,
					date: logDate,
					user: logUser,
					message: message,
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
						'board': res.locals.board,
					}
				});
				buildQueue.push({
					'task': 'buildModLogList',
					'options': {
						'board': res.locals.board,
					}
				});
			}
		}
	}

	//if there are actions that can cause some rebuilding
	if (res.locals.actions.numBuild > 0) {

		//recalculate replies and image counts
		if (aggregateNeeded) {
			const selectedPosts = res.locals.posts.filter(post => post.thread !== null);
//TODO: do this in a better way.
			await Promise.all(selectedPosts.map(async (post) => {
				const replyCounts = await Posts.getReplyCounts(post.board, post.thread);
				let replyposts = 0;
				let replyfiles = 0;
				if (replyCounts[0]) {
					replyposts = replyCounts[0].replyposts;
					replyfiles = replyCounts[0].replyfiles;
				}
				Posts.setReplyCounts(post.board, post.thread, replyposts, replyfiles);
			}));
		}

		//make it into an OR query for the db
		const queryOrs = [];
		for (let i = 0; i < threadBoards.length; i++) {
			const threadBoard = threadBoards[i];
			//convert this to an array while we are here
			boardThreadMap[threadBoard].threads = [...boardThreadMap[threadBoard].threads]
			queryOrs.push({
				'board': threadBoard,
				'postId': {
					'$in': boardThreadMap[threadBoard].threads
				}
			})
		}


		//fetch threads per board that we only checked posts for
		let threadsEachBoard = await Posts.db.find({
			'thread': null,
			'$or': queryOrs
		}).toArray();

		//combine it with what we already had
		const selectedThreads = res.locals.posts.filter(post => post.thread === null)
		threadsEachBoard = threadsEachBoard.concat(selectedThreads)

		//get the oldest and newest thread for each board to determine how to delete
		const threadBounds = threadsEachBoard.reduce((acc, curr) => {
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

		for (let i = 0; i < threadBoards.length; i++) {
			const boardName = threadBoards[i];
			const bounds = threadBounds[boardName];
			const board = buildBoards[boardName];
			//rebuild impacted threads
			for (let j = 0; j < boardThreadMap[boardName].threads.length; j++) {
				buildQueue.push({
					'task': 'buildThread',
					'options': {
						'threadId': boardThreadMap[boardName].threads[j],
						'board': board,
					}
				});
			}
			//refersh any pages affected
			const afterPages = Math.ceil((await Posts.getPages(boardName)) / 10);
			let catalogRebuild = true;
			if (beforePages[boardName] && beforePages[boardName] !== afterPages) {
				//amount of pages changed, rebuild all pages and delete  any further pages (if pages amount decreased)
				if (afterPages < beforePages[boardName]) {
					//amount of pages decreased
					for (let k = beforePages[boardName]; k > afterPages; k--) {
						//deleting html for pages that no longer should exist
						parallelPromises.push(remove(`${uploadDirectory}html/${boardName}/${k}.html`));
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
				if (req.body.delete || req.body.delete_ip_board || req.body.delete_ip_global) {
					if (!boardThreadMap[boardName].directThreads) {
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
				} else if (req.body.lock || req.body.sage || req.body.cyclic || req.body.unlink_file) {
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
					if (!boardThreadMap[boardName].directThreads) {
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
		'redirect': `/${req.params.board ? req.params.board+'/' : 'globalmanage.html'}`
	});

}
