'use strict';

const { Boards, Accounts } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, restrictedURIs = new Set(['captcha', 'forms', 'randombanner', 'all'])
	, { ensureDir } = require('fs-extra')
	, { boardDefaults } = require(__dirname+'/../../configs/main.js');

module.exports = async (req, res, next) => {

	const { name, description } = req.body
		, uri = req.body.uri.toLowerCase()
		, tags = req.body.tags.split(/\r?\n/).filter(n => n)
		, owner = req.session.user;

	if (restrictedURIs.has(uri)) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad Request',
			'message': 'That URI is not available for board creation',
			'redirect': '/create.html'
		});
	}

	const board = await Boards.findOne(uri);

	// if board exists reject
	if (board != null) {
		return dynamicResponse(req, res, 409, 'message', {
			'title': 'Conflict',
			'message': 'Board with this URI already exists',
			'redirect': '/create.html'
		});
	}


	//todo: add a settings for defaults
	const newBoard = {
		'_id': uri,
		owner,
		'banners': [],
		'sequence_value': 1,
		'pph': 0,
		'ips': 0,
		'lastPostTimestamp': null,
		'settings': {
			name,
			description,
			tags,
			'moderators': [],
			...boardDefaults
		}
	}

	await Promise.all([
		Boards.insertOne(newBoard),
		Accounts.addOwnedBoard(owner, uri),
		ensureDir(`${uploadDirectory}/html/${uri}`),
		ensureDir(`${uploadDirectory}/json/${uri}`),
		ensureDir(`${uploadDirectory}/banner/${uri}`)
	]);

	return res.redirect(`/${uri}/index.html`);

}
