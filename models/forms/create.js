'use strict';

const { Boards, Accounts } = require(__dirname+'/../../db/')
	, { Binary } = require(__dirname+'/../../db/db.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, roleManager = require(__dirname+'/../../lib/permission/rolemanager.js')
	, uploadDirectory = require(__dirname+'/../../lib/file/uploaddirectory.js')
	, restrictedURIs = new Set(['captcha', 'forms', 'randombanner', 'all'])
	, { ensureDir } = require('fs-extra')
	, config = require(__dirname+'/../../lib/misc/config.js');

module.exports = async (req, res) => {

	const { __ } = res.locals;
	const { boardDefaults } = config.get;

	const { name, description } = req.body
		, uri = req.body.uri.toLowerCase()
		, tags = (req.body.tags || '').split(/\r?\n/).filter(n => n)
		, owner = req.session.user;

	if (restrictedURIs.has(uri)) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': __('Bad Request'),
			'message': __('URI "%s" is reserved', uri),
			'redirect': '/create.html'
		});
	}

	const board = await Boards.findOne(uri);

	// if board exists reject
	if (board != null) {
		return dynamicResponse(req, res, 409, 'message', {
			'title': __('Conflict'),
			'message': __('Board with this URI already exists'),
			'redirect': '/create.html'
		});
	}

	const newBoard = {
		'_id': uri,
		owner,
		tags,
		'banners': [],
		'sequence_value': 1,
		'pph': 0,
		'ppd': 0,
		'ips': 0,
		'lastPostTimestamp': null,
		'webring': false,
		'staff': {
			[owner]: {
				'permissions': Binary(roleManager.roles.BOARD_OWNER.array),
				'addedDate': new Date(),
			},
		},
		'flags': {},
		'assets': [],
		'settings': {
			name,
			description,
			...boardDefaults
		}
	};

	await Promise.all([
		Boards.insertOne(newBoard),
		Accounts.addOwnedBoard(owner, uri),
		ensureDir(`${uploadDirectory}/html/${uri}`),
		ensureDir(`${uploadDirectory}/json/${uri}`),
		ensureDir(`${uploadDirectory}/banner/${uri}`),
		ensureDir(`${uploadDirectory}/flag/${uri}`),
		ensureDir(`${uploadDirectory}/asset/${uri}`),
	]);

	return res.redirect(`/${req.body.uri}/index.html`);

};
