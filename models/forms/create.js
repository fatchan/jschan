'use strict';

const { Boards } = require(__dirname+'/../../db/')
	, { boardDefaults } = require(__dirname+'/../../configs/main.json');

module.exports = async (req, res, next) => {

	const { name, description } = req.body
		, uri = req.body.uri.toLowerCase()
		, tags = req.body.tags.split('\n').filter(n => n)
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
		'ips': 0,
		'settings': {
			name,
			description,
			tags,
			'moderators': [],
			...boardDefaults
		}
	}

	await Boards.insertOne(newBoard);

	return res.redirect(`/${uri}/index.html`);

}

