'use strict';

const editRole = require(__dirname+'/../../models/forms/editrole.js')
	, { Roles } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, existsBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		objectIdFields: ['roleid'],
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const errors = await checkSchema([
			{ result: existsBody(req.body.roleid), expected: true, error: __('Missing role id') },
			{ result: async () => {
				res.locals.editingRole = await Roles.findOne(req.body.roleid);
				return res.locals.editingRole != null && res.locals.editingRole.name !== 'ROOT';
			}, blocking: true, expected: true, error: __('You can\'t edit this role') },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': req.headers.referer || `/${req.params.board}/manage/roles.html`,
			});
		}

		try {
			await editRole(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
