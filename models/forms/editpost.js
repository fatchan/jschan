'use strict';

const { Posts, Modlogs } = require(__dirname+'/../../db/')
	, Permissions = require(__dirname+'/../../lib/permission/permissions.js')
	, { createHash } = require('crypto')
	, Mongo = require(__dirname+'/../../db/db.js')
	, { prepareMarkdown } = require(__dirname+'/../../lib/post/markdown/markdown.js')
	, messageHandler = require(__dirname+'/../../lib/post/message.js')
	, nameHandler = require(__dirname+'/../../lib/post/name.js')
	, getFilterStrings = require(__dirname+'/../../lib/post/getfilterstrings.js')
	, filterActions = require(__dirname+'/../../lib/post/filteractions.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, buildQueue = require(__dirname+'/../../lib/build/queue.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, { buildThread } = require(__dirname+'/../../lib/build/tasks.js');

module.exports = async (req, res) => {

/*
todo: handle some more situations
- last activity date
- correct bump date when editing thread or last post in a thread
- allow for regular users (OP ONLY) and option for staff to disable in board settings
- different permission levels for historical posts when remarked up (or not, fuck that)
*/

	const { filterBanAppealable, previewReplies, strictFiltering } = config.get;
	const { board, post } = res.locals;

	//filters
	if (!res.locals.permissions.get(Permissions.BYPASS_FILTERS)) {
		//only global filters are checked, because anybody who could edit bypasses board filters
		const { filters, filterMode, filterBanDuration } = config.get;
		if (filters.length > 0 && filterMode > 0) {
			let hitGlobalFilter = false;
			const { strictCombinedString } = getFilterStrings(req, res, strictFiltering);
			hitGlobalFilter = filters.find(filter => { return strictCombinedString.includes(filter.toLowerCase()); });
			//block/ban edit
			if (hitGlobalFilter) {
				return filterActions(req, res, hitGlobalFilter, null, 0, filterMode,
					0, filterBanDuration, filterBanAppealable, null);
			}
		}
	}

	//message hash
	let messageHash = null;
	if (req.body.message && req.body.message.length > 0) {
		const noQuoteMessage = req.body.message.replace(/>>\d+/g, '').replace(/>>>\/\w+(\/\d*)?/gm, '').trim();
		messageHash = createHash('sha256').update(noQuoteMessage).digest('base64');
	}
	//new name, trip and cap
	const { name, tripcode, capcode } = await nameHandler(req.body.name, res.locals.permissions,
		board.settings, board.owner, board.staff, res.locals.user ? res.locals.user.username : null);
	//new message and quotes
	const nomarkup = prepareMarkdown(req.body.message, false);
	const { message, quotes, crossquotes } = await messageHandler(nomarkup, req.body.board, post.thread, res.locals.permissions);

	//intersection/difference of quotes sets for linking and unlinking
	const oldQuoteIds = post.quotes.map(q => q._id.toString());
	const oldQuotesSet = new Set(oldQuoteIds);
	const newQuoteIds = quotes.map(q => q._id.toString());
	const newQuotesSet = new Set(newQuoteIds);

	const addedQuotesSet = new Set(newQuoteIds.filter(qid => !oldQuotesSet.has(qid)).map(Mongo.ObjectId));
	const removedQuotesSet = new Set(oldQuoteIds.filter(qid => !newQuotesSet.has(qid)).map(Mongo.ObjectId));

	//linking new added quotes
	if (addedQuotesSet.size > 0) {
		await Posts.db.updateMany({
			'_id': {
				'$in': [...addedQuotesSet]
			}
		}, {
			'$push': {
				'backlinks': { _id: post._id, postId: post.postId }
			}
		});
	}

	//unlinking removed quotes
	if (removedQuotesSet.size > 0) {
		await Posts.db.updateMany({
			'_id': {
				'$in': [...removedQuotesSet]
			}
		}, {
			'$pull': {
				'backlinks': {
					'postId': post.postId
				}
			}
		});
	}

	//update the post
	await Posts.db.updateOne({
		board: req.body.board,
		postId: post.postId
	}, {
		'$set': {
			edited: {
				username: req.body.hide_name ? 'Hidden User' : req.session.user,
				date: new Date(),
			},
			nomarkup,
			message,
			'messagehash': messageHash || null,
			quotes,
			crossquotes,
			name,
			tripcode,
			capcode,
			email: req.body.email,
			subject: req.body.subject,
		}
	});

	//add the edit to the modlog
	await Modlogs.insertOne({
		board: board._id,
		showLinks: true,
		postLinks: [{
			postId: post.postId,
			thread: post.thread,
		}],
		actions: 'Edit',
		date: new Date(),
		showUser: req.body.hide_name ? false : true,
		message: req.body.log_message || null,
		user: req.session.user,
		ip: {
			cloak: res.locals.ip.cloak,
			raw: res.locals.ip.raw,
		}
	});

	const buildOptions = {
		'threadId': post.thread || post.postId,
		'board': res.locals.board
	};

	//build thread immediately for redirect
	await buildThread(buildOptions);

	dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': 'Post edited successfully',
		'redirect': req.body.referer,
	});
	res.end();

	//rebuild the modlogs
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

	//check if post is visible in preview posts
	let postInPreviewPosts = false;
	if (post.thread) {
		const threadPreviewPosts = await Posts.db.find({
			'thread': post.thread,
			'board': board._id
		},{
			'projection': {
				'postId': 1, //only get postId
			}
		}).sort({
			'postId': -1
		}).limit(previewReplies).toArray();
		postInPreviewPosts = threadPreviewPosts.some(p => p.postId <= post.postId);
	}

	if (post.thread === null || postInPreviewPosts) {
		const threadPage = await Posts.getThreadPage(board._id, post.thread || post.postId);
		//rebuild index page if its a thread or visible in preview posts
		buildQueue.push({
			'task': 'buildBoard',
			'options': {
				'board': res.locals.board,
				'page': threadPage
			}
		});
	}

	if (post.thread === null) {
		//rebuild catalog if its a thread to correct catalog tile
		buildQueue.push({
			'task': 'buildCatalog',
			'options': {
				'board': res.locals.board,
			}
		});
	}

};
