'use strict';

const deleteFlags = require(__dirname+'/../../models/forms/deleteflags.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js');

module.exports = async (req, res, next) => {

	const errors = [];

	if (!req.body.checkedflags || req.body.checkedflags.length === 0) {
		errors.push('Must select at least one flag to delete');
	}

	if (errors.length > 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}/manage/assets.html`
		})
	}

	for (let i = 0; i < req.body.checkedflags.length; i++) {
		if (!res.locals.board.flags[req.body.checkedflags[i]]) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'message': 'Invalid flags selected',
				'redirect': `/${req.params.board}/manage/assets.html`
			})
		}
	}

	try {
		await deleteFlags(req, res, next);
	} catch (err) {
		console.error(err);
		return next(err);
	}

}
