'use strict';

const deleteCustomPage = require(__dirname+'/../../models/forms/deletecustompage.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		allowedArrays: ['checkedcustompages'],
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkedcustompages, 1), expected: false, error: __('Must select at least one custom page to delete') },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': `/${req.params.board}/manage/custompages.html`
			});
		}

		try {
			await deleteCustomPage(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
