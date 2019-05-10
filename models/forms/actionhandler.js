'use strict';

const Posts = require(__dirname+'/../../db/posts.js')
	, Mongo = require(__dirname+'/../../db/db.js')
	, banPoster = require(__dirname+'/ban-poster.js')
	, deletePosts = require(__dirname+'/delete-post.js')
	, spoilerPosts = require(__dirname+'/spoiler-post.js')
	, stickyPosts = require(__dirname+'/stickyposts.js')
	, sagePosts = require(__dirname+'/sageposts.js')
	, lockPosts = require(__dirname+'/lockposts.js')
	, deletePostsFiles = require(__dirname+'/deletepostsfiles.js')
	, reportPosts = require(__dirname+'/report-post.js')
	, globalReportPosts = require(__dirname+'/globalreportpost.js')
	, dismissReports = require(__dirname+'/dismiss-report.js')
	, dismissGlobalReports = require(__dirname+'/dismissglobalreport.js')
	, actionChecker = require(__dirname+'/../../helpers/actionchecker.js')
	, checkPerms = require(__dirname+'/../../helpers/hasperms.js')
	, remove = require('fs-extra').remove
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js');

module.exports = async (req, res, next) => {


	const errors = [];

	//make sure they checked 1-10 posts
	if (!req.body.checkedposts || req.body.checkedposts.length === 0 || req.body.checkedposts.length > 10) {
		errors.push('Must select 1-10 posts');
	}

	//get what type of actions
	const { anyPasswords, anyAuthed, anyValid } = actionChecker(req);

	//make sure they selected at least 1 action
	if (!anyValid) {
		errors.push('No actions selected');
	}
	//check if they have permission to perform the actions
	const hasPerms = checkPerms(req, res);
	if(!hasPerms && anyAuthed) {
		errors.push('No permission');
	}

	//check that actions are valid
	if (req.body.password && req.body.password.length > 50) {
		errors.push('Password must be 50 characters or less');
	}
	if (req.body.report_reason && req.body.report_reason.length > 50) {
		errors.push('Report must be 50 characters or less');
	}
	if (req.body.ban_reason && req.body.ban_reason.length > 50) {
		errors.push('Ban reason must be 50 characters or less');
	}
	if ((req.body.report || req.body.global_report) && (!req.body.report_reason || req.body.report_reason.length === 0)) {
		errors.push('Reports must have a reason');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}/`
		})
	}

	let posts = await Posts.getPosts(req.params.board, req.body.checkedposts, true);
	if (!posts || posts.length === 0) {
		return res.status(404).render('message', {
			'title': 'Not found',
			'error': 'Selected posts not found',
			'redirect': `/${req.params.board}/`
		})
	}

	//get the ids
	const postMongoIds = posts.map(post => Mongo.ObjectId(post._id));
	let passwordPostMongoIds = [];
	let passwordPosts = [];
	if (!hasPerms && anyPasswords) {
		//just to avoid multiple filters and mapping, do it all here
		passwordPosts = posts.filter(post => {
			if (post.password != null
				&& post.password.length > 0
				&& post.password == req.body.password) {
				passwordPostMongoIds.push(Mongo.ObjectId(post._id))
				return true;
			}
		});
		if (passwordPosts.length === 0) {
			return res.status(403).render('message', {
				'title': 'Forbidden',
				'error': 'Password did not match any selected posts',
				'redirect': `/${req.params.board}/`
			});
		}
	} else {
		passwordPosts = posts;
		passwordPostMongoIds = postMongoIds;
	}

	const messages = [];
	const combinedQuery = {};
	const passwordCombinedQuery = {};
	let aggregateNeeded = false;
	try {
		if (hasPerms) {
			// if getting global banned, board ban doesnt matter
			if (req.body.global_ban) {
				const { message, action, query } = await banPoster(req, res, next, null, posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				}
				messages.push(message);
			} else if (req.body.ban) {
				const { message, action, query } = await banPoster(req, res, next, req.params.board, posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				}
				messages.push(message);
			}
		}
		if (hasPerms && (req.body.delete_ip_board || req.body.delete_ip_global)) {
			const deletePostIps = posts.map(x => x.ip);
			let query = {
				'ip': {
					'$in': deletePostIps
				}
			};
			if (req.body.delete_ip_board) {
				query['board'] = req.params.board;
			}
			const deleteIpPosts = await Posts.db.find(query).toArray();
			posts = posts.concat(deleteIpPosts);
			if (deleteIpPosts && deleteIpPosts.length > 0) {
				const { message } = await deletePosts(req, res, next, deleteIpPosts, req.params.board);
				messages.push(message);
				aggregateNeeded = true;
			}
		} else if (req.body.delete) {
			const { message } = await deletePosts(req, res, next, passwordPosts, req.params.board);
			messages.push(message);
			aggregateNeeded = true;
		} else {
			// if it was getting deleted, we cant do any of these
			if (req.body.delete_file) {
				const { message, action, query } = await deletePostsFiles(passwordPosts);
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
			if (hasPerms) {
				//lock, sticky, sage
				if (req.body.sage) {
					const { message, action, query } = sagePosts(posts);
					if (action) {
						combinedQuery[action] = { ...combinedQuery[action], ...query}
					}
					messages.push(message);
				}
				if (req.body.lock) {
					const { message, action, query } = lockPosts(posts);
					if (action) {
						combinedQuery[action] = { ...combinedQuery[action], ...query}
					}
					messages.push(message);
				}
				if (req.body.sticky) {
					const { message, action, query } = stickyPosts(posts);
					if (action) {
						combinedQuery[action] = { ...combinedQuery[action], ...query}
					}
					messages.push(message);
				}
			}
			// cannot report and dismiss at same time
			if (req.body.report) {
				const { message, action, query } = reportPosts(req, posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				}
				messages.push(message);
			} else if (hasPerms && req.body.dismiss) {
				const { message, action, query } = dismissReports(posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				}
				messages.push(message);
			}
			// cannot report and dismiss at same time
			if (req.body.global_report) {
				const { message, action, query } = globalReportPosts(req, posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				}
				messages.push(message);
			} else if (hasPerms && req.body.global_dismiss) {
				const { message, action, query } = dismissGlobalReports(posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				}
				messages.push(message);
			}
		}
		const bulkWrites = []
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
		if (bulkWrites.length > 0) {
			await Posts.db.bulkWrite(bulkWrites);
		}

		//get only posts (so we can use them for thread ids
		const postThreadsToUpdate = posts.filter(post => post.thread !== null);
		if (aggregateNeeded) {
			//recalculate replies and image counts
			await Promise.all(postThreadsToUpdate.map(async (post) => {
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

		//map thread ids to board
		const boardThreadMap = {};
		const queryOrs = [];
		for (let i = 0; i < posts.length; i++) {
			const post = posts[i];
			if (!boardThreadMap[post.board]) {
				boardThreadMap[post.board] = [];
			}
			boardThreadMap[post.board].push(post.thread || post.postId);
		}

		//make it into an OR query for the db
		const threadBoards = Object.keys(boardThreadMap);
		for (let i = 0; i < threadBoards.length; i++) {
			const threadBoard = threadBoards[i];
			boardThreadMap[threadBoard] = [...new Set(boardThreadMap[threadBoard])]
			queryOrs.push({
				'board': threadBoard,
				'postId': {
					'$in': boardThreadMap[threadBoard]
				}
			})
		}

		//fetch threads per board that we only checked posts for
		let threadsEachBoard = await Posts.db.find({
			'thread': null,
			'$or': queryOrs
		}).toArray();
		//combine it with what we already had
		threadsEachBoard = threadsEachBoard.concat(posts.filter(post => post.thread === null))

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

//console.log(threadBounds);
//console.log(boardThreadMap);
		//now we need to delete outdated html
		//TODO: not do this for reports, handle global actions & move to separate handler + optimize and test
		const removePromises = []
		const boardsWithChanges = Object.keys(threadBounds);
		for (let i = 0; i < boardsWithChanges.length; i++) {
			const changeBoard = boardsWithChanges[i];
			const bounds = threadBounds[changeBoard];
//console.log(changeBoard, 'OLDEST thread', bounds.oldest.postId)
//console.log(changeBoard, 'NEWEST thread', bounds.newest.postId)
			//always need to refresh catalog
			removePromises.push(remove(`${uploadDirectory}html/${changeBoard}/catalog.html`));
			//refresh any impacted threads
			for (let j = 0; j < boardThreadMap[changeBoard].length; j++) {
				removePromises.push(remove(`${uploadDirectory}html/${changeBoard}/thread/${boardThreadMap[changeBoard][j]}.html`));
//console.log(changeBoard, 'update thread', boardThreadMap[changeBoard][j]);
			}
			//refersh all pages affected
			const maxPages = Math.ceil((await Posts.getPages(changeBoard)) / 10);
			let pagesToRemoveAfter;
			let pagesToRemoveBefore;
			if (req.body.delete || req.body.delete_ip_board || req.body.delete_ip_global) { //deletes only affect later pages as they end up higher up
				//remove current and later pages for deletes
				pagesToRemoveAfter = Math.ceil((await Posts.getAfterCount(changeBoard, bounds.newest))/10) || 1;
//console.log(changeBoard, 'pages to remove after newest affected thread', pagesToRemoveAfter);
				for (let j = maxPages; j > maxPages-pagesToRemoveAfter; j--) {
//console.log(`${uploadDirectory}html/${changeBoard}/${j == 1 ? 'index' : j}.html`)
					removePromises.push(remove(`${uploadDirectory}html/${changeBoard}/${j == 1 ? 'index' : j}.html`));
				}
			} else if (req.body.sticky) { //use an else if because if deleting, other actions are not executed/irrelevant
				//remove current and newer pages for stickies
				pagesToRemoveBefore = Math.ceil((await Posts.getBeforeCount(changeBoard, bounds.oldest))/10) || 1;
//console.log(changeBoard, 'pages to remove before oldest affected thread', pagesToRemoveBefore);
				for (let j = 1; j <= pagesToRemoveBefore; j++) {
//console.log(`${uploadDirectory}html/${changeBoard}/${j == 1 ? 'index' : j}.html`)
					removePromises.push(remove(`${uploadDirectory}html/${changeBoard}/${j == 1 ? 'index' : j}.html`));
				}
			} else if ((hasPerms && (req.body.lock || req.body.sage)) || req.body.spoiler) { //these actions do not affect other pages
				//remove only pages with affected threads
				if (!pagesToRemoveBefore) {
					pagesToRemoveBefore = Math.ceil((await Posts.getBeforeCount(changeBoard, bounds.oldest))/10) || 1;
				}
				if (!pagesToRemoveAfter) {
					pagesToRemoveAfter = Math.ceil((await Posts.getAfterCount(changeBoard, bounds.newest))/10) || 1;
				}
//console.log(changeBoard, 'remove all inbetween pages because finding affected pages is hard at 1am', pagesToRemoveBefore, pagesToRemoveAfter)
	//console.log(pagesToRemoveBefore, pagesToRemoveAfter, maxPages)
				for (let j = pagesToRemoveBefore; j <= maxPages-pagesToRemoveAfter+1; j++) {
	//console.log(j)
//console.log(`${uploadDirectory}html/${changeBoard}/${j == 1 ? 'index' : j}.html`)
					removePromises.push(remove(`${uploadDirectory}html/${changeBoard}/${j == 1 ? 'index' : j}.html`));
				}
			}
			const maxPagesAfter = Math.ceil((await Posts.getPages(changeBoard)) / 10);
			if (maxPages !== maxPagesAfter) {
				// number of pages changed, delete all pages (because of page number buttons on existing pages)
				for (let j = 1; j <= maxPages; j++) {
//console.log(`${uploadDirectory}html/${changeBoard}/${j == 1 ? 'index' : j}.html`)
					removePromises.push(remove(`${uploadDirectory}html/${changeBoard}/${j == 1 ? 'index' : j}.html`));
				}
			}
		}
		await Promise.all(removePromises);

	} catch (err) {
		return next(err);
	}

	return res.render('message', {
		'title': 'Success',
		'messages': messages,
		'redirect': `/${req.params.board}/`
	});

}
