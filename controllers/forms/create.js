'use strict';

const createBoard = require(__dirname+'/../../models/forms/create.js')
	, { enableUserBoards } = require(__dirname+'/../../configs/main.json')
	, boardUriRegex = require(__dirname+'/../../helpers/checks/boarduriregex.js')

module.exports = async (req, res, next) => {

	if (enableUserBoards === false && res.locals.permLevel !== 0) {
		//only board admin can create boards when user board creation disabled
		return res.status(400).render('message', {
			'title': 'Bad request',
			'error': 'Board creation is only available to site administration',
			'redirect': '/'
		})
	}

	const errors = [];

	//check exist
	if (!req.body.uri || req.body.uri.length <= 0) {
		errors.push('Missing URI');
	}
	if (!req.body.name || req.body.name.length <= 0) {
		errors.push('Missing name');
	}
	if (!req.body.description || req.body.description.length <= 0) {
		errors.push('Missing description');
	}

	//other validation
	if (req.body.uri) {
		if (req.body.uri.length > 50) {
			errors.push('URI must be 50 characters or less');
		}
		if (boardUriRegex.test(req.body.uri) !== true) {
			errors.push('URI must contain a-z 0-9 only');
		}
	}
	if (req.body.name && req.body.name.length > 50) {
		errors.push('Name must be 50 characters or less');
	}
	if (req.body.description && req.body.description.length > 50) {
		errors.push('Description must be 50 characters or less');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': '/create.html'
		});
	}

	try {
		await createBoard(req, res, next);
	} catch (err) {
		return next(err);
	}

}
