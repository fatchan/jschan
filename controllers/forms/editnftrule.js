'use strict';

const editNftRule = require(__dirname+'/../../models/forms/editnftrule.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody, existsBody, inArrayBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['name', 'network', 'contract_address', 'abi'],
		numberFields: ['token_id'],
		objectIdFields: ['nftrule_id']
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const errors = await checkSchema([
			{ result: lengthBody(req.body.name, 1), expected: false, error: __('Missing name') },
			{ result: existsBody(req.body.nftrule_id), expected: true, error: __('Missing filter id') },
			{ result: lengthBody(req.body.contract_address, 42, 42), expected: false, error: __('Invalid contract address') },
			{ result: inArrayBody(req.body.network, ['ethereum', 'arbitrum', 'base']), expected: true, error: __('Invalid network') },
			{ result: lengthBody(req.body.abi, 1), expected: false, error: __('Invalid ABI') },
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': req.headers.referer || (req.params.board ? `/${req.params.board}/manage/filters.html` : '/globalmanage/filters.html')
			});
		}

		try {
			await editNftRule(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
