'use strict';

const addNftRule = require(__dirname+'/../../models/forms/addnftrule.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody, inArrayBody } = require(__dirname+'/../../lib/input/schema.js');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['network', 'contract_address', 'abi'],
		numberFields: ['token_id'],
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;

		const errors = await checkSchema([
			{ result: lengthBody(req.body.contract_address, 42, 42), expected: false, error: __('Invalid contract address') },
			{ result: inArrayBody(req.body.network, ['ethereum', 'arbitrum', 'base']), expected: true, error: __('Invalid network') },
			{ result: lengthBody(req.body.abi, 0), expected: false, error: __('Invalid ABI') },
			//TODO: permissions validation?
		]);

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': req.params.board ? `/${req.params.board}/manage/nfts.html` : '/globalmanage/nfts.html'
			});
		}

		try {
			await addNftRule(req, res, next);
		} catch (err) {
			return next(err);
		}

	}

};
