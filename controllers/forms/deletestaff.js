'use strict';

const deleteStaff = require(__dirname+'/../../models/forms/deletestaff.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { Permissions } = require(__dirname+'/../../lib/permission/permissions.js')
	, { checkSchema, lengthBody, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		allowedArrays: ['checkedstaff'],
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkedstaff, 1), expected: false, error: __('Must select at least one staff to delete') },
			{ result: existsBody(req.body.checkedstaff) && req.body.checkedstaff.some(s => !res.locals.board.staff[s]), expected: false, error: __('Invalid staff selection') },
			{ result: existsBody(req.body.checkedstaff) && req.body.checkedstaff.some(s => s === res.locals.board.owner), expected: false, permission: Permissions.ROOT, error: __('You can\'t delete the board owner') },
			//not really necessary, but its a bit retarded to "delete yourself" as staff this way
			{ result: existsBody(req.body.checkedstaff) && req.body.checkedstaff.some(s => s === res.locals.user.username), expected: false, error: __('Resign from the accounts page instead') },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': req.headers.referer || `/${req.params.board}/manage/staff.html`,
			});
		}

		try {
			await deleteStaff(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
