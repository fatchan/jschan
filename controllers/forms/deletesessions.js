'use strict';

const deleteSessions = require(__dirname+'/../../models/forms/deletesessions.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		allowedArrays: ['checkedsessionids'],
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const username = res.locals.user.username;

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkedsessionids, 1), expected: false, blocking: true, error: __('Must select at least one session to delete') },
			{ result: () => {
				//return if any input "session ids" dont start with sess: or dont end with :username
				return req.body.checkedsessionids.some(sid => !sid.startsWith('sess:') || !sid.endsWith(`:${username}`));
			}, expected: false, error: __('Invalid checked sessions') },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': '/sessions.html',
			});
		}

		try {
			await deleteSessions(req.body.checkedsessionids);
		} catch (err) {
			return next(err);
		}

		return dynamicResponse(req, res, 200, 'message', {
			'title': __('Success'),
			'message': __('Sessions deleted'),
			'redirect': '/sessions.html', //if deleting all, will get redirected back to login anyway
		});

	}

};
