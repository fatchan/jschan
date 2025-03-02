'use strict';

const dynamicResponse = require(__dirname+'/../../misc/dynamic.js')
	, paramConverter = require(__dirname+'/../input/paramconverter.js')
	, { checkSchema, existsBody } = require(__dirname+'/../../input/schema.js')
	, config = require(__dirname+'/../../misc/config.js')
	, { timingSafeEqual } = require('crypto')
	, cache = require(__dirname+'/../../redis/redis.js')
	, { recover: web3EthAccountsRecover } = require('web3-eth-accounts')
	, { isAddress: web3UtilsIsAddress } = require('web3-utils');

const checkNonceParamConverter = paramConverter({
	trimFields: ['nonce', 'signature', 'address'],
	processBodyArrays: false,
});

module.exports = async (req, res, next) => {

	const { enableWeb3: globalWeb3 } = config.get;
	const boardWeb3 = res.locals.board ? res.locals.board.settings.enableWeb3 === true : true;
	const { __ } = res.locals;

	checkNonceParamConverter(req, res, async () => {
	
		res.locals.isWeb3 = req.body.signature && req.body.signature.length > 0;

		let errors = [];

		if (res.locals.isWeb3) {
			errors = await checkSchema([
				{ result: globalWeb3 === true && boardWeb3 === true, expected: true, error: __('Web3 features not enabled') },
				{ result: web3UtilsIsAddress(req.body.address), expected: true, error: __('Invalid address') },
				{ result: existsBody(req.body.nonce), expected: true, error: __('Missing nonce') },
				{ result: existsBody(req.body.signature), expected: true, error: __('Missing signature') },
			]);
		}

		if (errors.length > 0) {
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'errors': errors,
				'redirect': '/login.html'
			});
		}

		try {
			if (res.locals.isWeb3) {
				const { address, nonce, signature } = req.body;
				const nonceRequest = await cache.del(`nonce:${address}:${nonce}`);
				if (!nonceRequest || nonceRequest !== 1) {
					return dynamicResponse(req, res, 400, 'message', {
						'title': __('Bad Request'),
						'error': __('Web3 validation timed out'),
						'redirect': '/login.html'
					});
				}
				const fixedMessage = req.body.rawMessage ? req.body.rawMessage.replace(/\r\n/igm, '\n') : null;
				const combinedRecoverText = `${fixedMessage ? fixedMessage+'\n' : ''}Nonce: ${nonce}`;
				res.locals.recoveredAddress = (await web3EthAccountsRecover(combinedRecoverText, signature)).toLowerCase();
				res.locals.web3SignatureMatch = await timingSafeEqual(Buffer.from(res.locals.recoveredAddress), Buffer.from(address));
				if (res.locals.web3SignatureMatch !== true) {
					return dynamicResponse(req, res, 400, 'message', {
						'title': __('Bad Request'),
						'error': __('Invalid web3 signature'),
						'redirect': '/login.html'
					});
				}
			}
			return next();
		} catch (err) {
			return next(err);
		}

	});

};
