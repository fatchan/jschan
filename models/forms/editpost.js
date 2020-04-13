'use strict';

const { Posts, Bans } = require(__dirname+'/../../db/')
	, getTripCode = require(__dirname+'/../../helpers/posting/tripcode.js')
	, messageHandler = require(__dirname+'/../../helpers/posting/message.js')
	, nameHandler = require(__dirname+'/../../helpers/posting/name.js')
	, { strictFiltering } = require(__dirname+'/../../configs/main.js');
//	, buildQueue = require(__dirname+'/../../queue.js')
//	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
//	, { buildThread } = require(__dirname+'/../../helpers/tasks.js')

module.exports = async (req, res, next) => {

/*
	todo:
	-quote un/re-linking
	-rebuilds
	-redirects to dynamicresponse
*/

	const { board, post } = res.locals;

	//filters
	if (res.locals.permLevel > 1) { //global staff bypass filters for edit
		const globalSettings = await cache.get('globalsettings');
		if (globalSettings && globalSettings.filters.length > 0 && globalSettings.filterMode > 0) {
			let hitGlobalFilter = false
				, ban
				, concatContents = `|${req.body.name}|${req.body.message}|${req.body.subject}|${req.body.email}|${res.locals.numFiles > 0 ? req.files.file.map(f => f.name).join('|') : ''}`.toLowerCase()
				, allContents = concatContents;
			if (strictFiltering) {
				allContents += concatContents.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); //removing diacritics
				allContents += concatContents.replace(/[\u200B-\u200D\uFEFF]/g, ''); //removing ZWS
				allContents += concatContents.replace(/[^a-zA-Z0-9.-]+/gm, ''); //removing anything thats not alphamnumeric or . and -
			}
			//global filters
			hitGlobalFilter = globalSettings.filters.some(filter => { return allContents.includes(filter.toLowerCase()) });
			if (hitGlobalFilter) {
				if (globalSettings.filterMode === 1) {
					return dynamicResponse(req, res, 400, 'message', {
						'title': 'Bad request',
						'message': 'Your edit was blocked by a global word filter',
						//'redirect': redirect
					});
				} else {
					const banDate = new Date();
					const banExpiry = new Date(globalSettings.filterBanDuration + banDate.getTime());
					const ban = {
						'ip': res.locals.ip.single,
						'reason': 'global word filter auto ban',
						'board': null,
						'posts': null,
						'issuer': 'system', //what should i call this
						'date': banDate,
						'expireAt': banExpiry,
						'allowAppeal': true, //should i make this configurable if appealable?
						'seen': false
					};
 					await Bans.insertOne(ban);
					const bans = await Bans.find(res.locals.ip.single, banBoard); //need to query db so it has _id field for appeal checkmark
					return res.status(403).render('ban', {
						bans: bans
					});
				}
			}
		}
	}

	//new name, trip and cap
	const { name, tripcode, capcode } = await nameHandler(req.body.name, res.locals.permLevel, board.settings);
	//new message and quotes
	const { message, quotes, crossquotes } = await messageHandler(req.body.message, req.body.board, post.thread);
	//todo: email and subject (probably dont need any transformation since staff bypass limits on forceanon, and it doesnt have to account for sage/etc

	console.log('old quotes', post.quotes)
	console.log('new quotes', quotes)

//find intersection of old and new quotes
//unlink any quotes that dont exist anymore
//NOTE: crossquotes can be ignored since they dont create backlinks, and can just be overwritten in updated post obejct
/*
	//linking only new quotes to new posts
	if (newQuotes.length > 0) {
		await Posts.db.updateMany({
			'_id': {
				'$in': newQuotes.map(q => q._id)
			}
		}, {
			'$push': {
				'backlinks': { _id: post._id, postId: post.postId }
			}
		});
	}
*/

/*
	//unlinking only old backlinks that shouldnt exist anymore
	if (oldQuotes.length > 0) {
		await Posts.db.updateMany({
				'_id': {
					'$in': oldQuotes.map(q => q._id)
				}
			}, {
				'$pull': {
					'backlinks': {
						'postId': post.postId
					}
				}
			}
		});
	}
*/

	//new edited prop for post
	const edited = {
		username: req.session.user.username,
		date: new Date(),
	}

	//update the post
	const postId = await Posts.updateOne({
		board: req.body.board,
		postId: post.postId
	}, {
		'$set': {
			edited,

			message,
			quotes,
			crossquotes,

			name,
			tripcode,
			capcode,

			email,
			subject,
		}
	});

	//optional: update last board activity? probs not tho

	//success message

	//rebuild thread
	//rebuild index page
	//if OP, rebuild catalog

}
