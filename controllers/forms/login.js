'use strict';

const loginAccount = require(__dirname+'/../../models/forms/login.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, paramConverter = require(__dirname+'/../../lib/middleware/input/paramconverter.js')
	, { checkSchema, lengthBody, existsBody } = require(__dirname+'/../../lib/input/schema.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, { timingSafeEqual } = require('crypto')
	, cache = require(__dirname+'/../../lib/redis/redis.js')
	, { recover: web3EthAccountsRecover } = require('web3-eth-accounts')
	, { isAddress: web3UtilsIsAddress } = require('web3-utils');

module.exports = {

	paramConverter: paramConverter({
		trimFields: ['twofactor', 'username', 'password', 'twofactor', 'nonce', 'signature', 'address'],
	}),

	controller: async (req, res, next) => {

		const { __ } = res.locals;
		const { enableWeb3 } = config.get;
		res.locals.isWeb3 = req.body.address && req.body.address.length > 0;

		let errors = [];

		if (res.locals.isWeb3) {
			errors = await checkSchema([
				{ result: enableWeb3 === true, expected: true, error: __('Web3 logins disabled') },
				{ result: web3UtilsIsAddress(req.body.address), expected: true, error: __('Invalid address') },
				{ result: existsBody(req.body.nonce), expected: true, error: __('Missing nonce') },
				{ result: existsBody(req.body.signature), expected: true, error: __('Missing signature') },
			]);
		} else {
			errors = await checkSchema([
				{ result: existsBody(req.body.username), expected: true, error: __('Missing username') },
				{ result: existsBody(req.body.password), expected: true, error: __('Missing password') },
				{ result: web3UtilsIsAddress(req.body.username), expected: false, error: __('Username must not be an ethereum address') },
				{ result: lengthBody(req.body.username, 0, 50), expected: false, error: __('Username must be 1-50 characters') },
				{ result: lengthBody(req.body.password, 0, 100), expected: false, error: __('Password must be 1-100 characters') },
				{ result: lengthBody(req.body.twofactor, 0, 6), expected: false, error: __('Invalid 2FA code') },
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
						'error': __('Login timed out'),
						'redirect': '/login.html'
					});
				}
				let recoveredAddress = (await web3EthAccountsRecover(`Nonce: ${nonce}`, signature)).toLowerCase();
				const match = await timingSafeEqual(Buffer.from(recoveredAddress), Buffer.from(address));
				if (match !== true) {
					return dynamicResponse(req, res, 400, 'message', {
						'title': __('Bad Request'),
						'error': __('Invalid login signature'),
						'redirect': '/login.html'
					});
				}
			}
			await loginAccount(req, res, next);
		} catch (err) {
			return next(err);
		}

	},

};
