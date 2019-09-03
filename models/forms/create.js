'use strict';

const { Boards } = require(__dirname+'/../../db/');

module.exports = async (req, res, next) => {

	const { name, description } = req.body
		, uri = req.body.uri.toLowerCase()
		, tags = req.body.tags.split('\n')
		, board = await Boards.findOne(uri);

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
			tags,
			'moderators': [],
			'locked': false,
			'captchaMode': 0,
			'tphTrigger': 10,
			'tphTriggerAction': 1,
			'forceAnon': false,
			'early404': true,
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
			'filters': [],
			'filterMode': 0,
			'filterBanDuration': 0,
			'theme': 'lain',
			'announcement': {
				'raw':null,
				'markdown':null
			},
			'allowedFileTypes': {
				'animatedImage': true,
				'image': true,
				'video': true,
			}
		}
	}

	await Boards.insertOne(newBoard);

	return res.redirect(`/${uri}/index.html`);

}

