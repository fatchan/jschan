'use strict';

const deleteNftRule = require(__dirname+'/../../models/forms/deletenftrule.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		allowedArrays: ['checkednftrules'],
		objectIdArrays: ['checkednftrules']
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const errors = await checkSchema([
			{ result: lengthBody(req.body.checkednftrules, 1), expected: false, error: __('Must select at least one nft rule to delete') },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': req.params.board ? `/${req.params.board}/manage/nfts.html` : '/globalmanage/nfts.html'
			});
		}

		try {
			await deleteNftRule(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
