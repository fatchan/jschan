'use strict';

const Boards = require(__dirname+'/../../db/boards.js');

module.exports = async (req, res, next) => {

	const { name, description } = req.body
		, uri = req.body.uri.toLowerCase();

	let board;
	try {
		board = await Boards.findOne(uri);
	} catch (err) {
		return next(err);
	}

	// if board exists reject
	if (board != null) {
		return res.status(409).render('message', {
			'title': 'Conflict',
			'message': 'Board with this URI already exists',
			'redirect': '/create.html'
		});
	}

	//todo: add a settings for defaults
	const newBoard = {
		'_id': uri,
		'owner': req.session.user.username,
		'banners': [],
		'sequence_value': 1,
		'pph': 0,
		'settings': {
			name,
			description,
			'moderators': [],
			'locked': false,
			'captchaMode': 0,
			'tphTrigger': 0,
			'tphTriggerAction': 0,
			'forceAnon': false,
			'ids': false,
			'userPostDelete': true,
			'userPostSpoiler': true,
			'userPostUnlink': true,
			'threadLimit': 200,
			'replyLimit': 500,
			'maxFiles': 3,
			'forceReplyMessage': false,
			'forceReplyFile': false,
			'forceThreadMessage': false,
			'forceThreadFile': false,
			'forceThreadSubject': false,
			'minThreadMessageLength': 0,
			'minReplyMessageLength': 0,
			'defaultName': 'Anonymous',
			'announcement': {
				'raw':null,
				'markdown':null
			},
			'filters':[]
		}
	}

	try {
		await Boards.insertOne(newBoard);
	} catch (err) {
		return next(err);
	}

	return res.redirect(`/${uri}/index.html`);

}

