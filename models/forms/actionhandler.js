'use strict';

const Posts = require(__dirname+'/../../db/posts.js')
	, Boards = require(__dirname+'/../../db/boards.js')
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
	, globalReportPosts = require(__dirname+'/globalreportpost.js')
	, dismissReports = require(__dirname+'/dismissreport.js')
	, dismissGlobalReports = require(__dirname+'/dismissglobalreport.js')
	, { remove } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, { buildCatalog, buildThread, buildBoardMultiple } = require(__dirname+'/../../helpers/build.js')
	, { postPasswordSecret } = require(__dirname+'/../../configs/main.json')
	, { createHash, timingSafeEqual } = require('crypto');

module.exports = async (req, res, next) => {

	//get the ids
	const postMongoIds = res.locals.posts.map(post => Mongo.ObjectId(post._id));
	let passwordPostMongoIds = [];
	let passwordPosts = [];
	if (res.locals.authLevel >= 4 && res.locals.actions.anyPasswords) {
		if (req.body.password && req.body.password.length > 0) {
			//hash their input and make it a buffer
			const inputPasswordHash = createHash('sha256').update(postPasswordSecret + req.body.password).digest('base64');
			const inputPasswordBuffer = Buffer.from(inputPasswordHash);
			passwordPosts = res.locals.posts.filter(post => {
				//length comparison could reveal the length, but not contents, and is better than comparing and hashing for empty password (most posts)
				if (post.password != null && post.password.length === req.body.password) {
					const postBuffer = Buffer.from(post.password);
					if (timingSafeEqual(inputBuffer, postBuffer) === true) {
						passwordPostMongoIds.push(Mongo.ObjectId(post._id));
						return true;
					}
				}
			});
		}
		if (passwordPosts.length === 0) {
			return res.status(403).render('message', {
				'title': 'Forbidden',
				'error': 'Password did not match any selected posts',
				'redirect': `/${req.params.board ? req.params.board+'/' : 'globalmanage.html'}`
			});
		}
	} else {
		passwordPosts = res.locals.posts;
		passwordPostMongoIds = postMongoIds;
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
	const combinedQuery = {};
	const passwordCombinedQuery = {};
	let aggregateNeeded = false;
	try {
		// if getting global banned, board ban doesnt matter
		if (req.body.global_ban) {
			const { message, action, query } = await banPoster(req, res, next);
			if (action) {
				combinedQuery[action] = { ...combinedQuery[action], ...query}
			}
			messages.push(message);
		} else if (req.body.ban) {
			const { message, action, query } = await banPoster(req, res, next);
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
			const { action, message } = await deletePosts(passwordPosts, req.body.delete_ip_global ? null : req.params.board);
			messages.push(message);
			if (action) {
				aggregateNeeded = true;
			}
		} else {
			// if it was getting deleted, we cant do any of these
			if (req.body.unlink_file || req.body.delete_file) {
				const { message, action, query } = await deletePostsFiles(passwordPosts, req.body.unlink_file);
				if (action) {
					aggregateNeeded = true;
					passwordCombinedQuery[action] = { ...passwordCombinedQuery[action], ...query}
				}
				messages.push(message);
			} else if (req.body.spoiler) {
				const { message, action, query } = spoilerPosts(passwordPosts);
				if (action) {
					passwordCombinedQuery[action] = { ...passwordCombinedQuery[action], ...query}
				}
				messages.push(message);
			}
			//lock, sticky, sage, cyclic
			if (req.body.sage) {
				const { message, action, query } = sagePosts(res.locals.posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				}
				messages.push(message);
			}
			if (req.body.lock) {
				const { message, action, query } = lockPosts(res.locals.posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
                }
				messages.push(message);
			}
			if (req.body.sticky) {
				const { message, action, query } = stickyPosts(res.locals.posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
                }
				messages.push(message);
			}
			if (req.body.cyclic) {
				const { message, action, query } = cyclePosts(res.locals.posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
                }
				messages.push(message);
			}
			// cannot report and dismiss at same time
			if (req.body.report) {
				const { message, action, query } = reportPosts(req, res, res.locals.posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
                }
				messages.push(message);
			} else if (req.body.dismiss) {
				const { message, action, query } = dismissReports(res.locals.posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
                }
				messages.push(message);
			}
			// cannot report and dismiss at same time
			if (req.body.global_report) {
				const { message, action, query } = globalReportPosts(req, res, res.locals.posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				}
				messages.push(message);
			} else if (req.body.global_dismiss) {
				const { message, action, query } = dismissGlobalReports(res.locals.posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
                }
				messages.push(message);
			}
		}
//console.log(require('util').inspect(combinedQuery, {depth: null}))
		const bulkWrites = [];
		if (Object.keys(combinedQuery).length > 0) {
			bulkWrites.push({
				'updateMany': {
					'filter': {
						'_id': {
							'$in': postMongoIds
						}
					},
					'update': combinedQuery
				}
			});
		}
		if (Object.keys(passwordCombinedQuery).length > 0) {
			bulkWrites.push({
				'updateMany': {
					'filter': {
						'_id': {
							'$in': passwordPostMongoIds
						}
					},
					'update': passwordCombinedQuery
				}
			});
		}

		//execute actions now
		if (bulkWrites.length > 0) {
			await Posts.db.bulkWrite(bulkWrites);
		}

		//if there are actions that can cause some rebuilding
		if (res.locals.actions.anyBuild > 0) {

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

			const parallelPromises = []
			const boardNames = Object.keys(threadBounds);
			const buildBoards = {};
			const multiBoards = await Boards.db.find({
				'_id': {
					'$in': boardNames
				}
			}).toArray();
			multiBoards.forEach(board => {
				buildBoards[board._id] = board;
			});

			for (let i = 0; i < boardNames.length; i++) {
				const boardName = boardNames[i];
				const bounds = threadBounds[boardName];
				//rebuild impacted threads
				for (let j = 0; j < boardThreadMap[boardName].threads.length; j++) {
					parallelPromises.push(buildThread(boardThreadMap[boardName].threads[j], buildBoards[boardName]));
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
					parallelPromises.push(buildBoardMultiple(buildBoards[boardName], 1, afterPages));
				} else {
					//number of pages did not change, only possibly building existing pages
					const threadPageOldest = await Posts.getThreadPage(boardName, bounds.oldest);
					const threadPageNewest = bounds.oldest.postId === bounds.newest.postId ? threadPageOldest : await Posts.getThreadPage(boardName, bounds.newest);
					if (req.body.delete || req.body.delete_ip_board || req.body.delete_ip_global) {
						if (!boardThreadMap[boardName].directThreads) {
							//onyl deleting posts from threads, so thread order wont change, thus we dont delete all pages after
							parallelPromises.push(buildBoardMultiple(buildBoards[boardName], threadPageNewest, threadPageOldest));
						} else {
							//deleting threads, so we delete all pages after
							parallelPromises.push(buildBoardMultiple(buildBoards[boardName], threadPageNewest, afterPages));
						}
					} else if (req.body.sticky) { //else if -- if deleting, other actions are not executed/irrelevant
						//rebuild current and newer pages
						parallelPromises.push(buildBoardMultiple(buildBoards[boardName], 1, threadPageOldest));
					} else if (req.body.lock || req.body.sage || req.body.cyclic || req.body.unlink_file) {
						parallelPromises.push(buildBoardMultiple(buildBoards[boardName], threadPageNewest, threadPageOldest));
					} else if (req.body.spoiler || req.body.ban || req.body.global_ban) {
						parallelPromises.push(buildBoardMultiple(buildBoards[boardName], threadPageNewest, threadPageOldest));
						if (!boardThreadMap[boardName].directThreads) {
							catalogRebuild = false;
							//these actions dont affect the catalog tile since not on an OP and dont change reply/image counts
						}
					}
				}
				if (catalogRebuild) {
					//the actions will affect the catalog, so we better rebuild it
					parallelPromises.push(buildCatalog(buildBoards[boardName]));
				}
			}
			await Promise.all(parallelPromises);
		}

	} catch (err) {
		return next(err);
	}

	return res.render('message', {
		'title': 'Success',
		'messages': messages,
		'redirect': `/${req.params.board ? req.params.board+'/' : 'globalmanage.html'}`
	});

}
