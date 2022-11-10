'use strict';

const redis = require(__dirname+'/../../lib/redis/redis.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, { Accounts } = require(__dirname+'/../../db/')
	, doTwoFactor = require(__dirname+'/../../lib/misc/dotwofactor.js');

module.exports = async (req, res) => {

	const username = res.locals.user.username.toLowerCase();

	// Get the temporary secret from redis and check it exists
	const tempSecret = await redis.get(`twofactor_tempsecret:${username}`);
	if (!tempSecret || !username) {
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': '2FA QR code expired, try again',
			'redirect': '/twofactor.html',
		});
	}

	// Validate totp
	const delta = await doTwoFactor(username, tempSecret, req.body.twofactor);

	// Check if code was valid
	if (delta === null) {
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': 'Incorrect 2FA code',
			'redirect': '/twofactor.html',
		});
	}
	redis.del(`twofactor_tempsecret:${username}`);
	
	// Successfully enabled 2FA
	await Accounts.updateTwofactor(username, tempSecret);

	// Logout all sessions, 2FA now required
	await Promise.all([
		req.session.destroy(),
		redis.del(`users:${username}`),
		redis.deletePattern(`sess:*:${username}`),
	]);

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': 'Two factor authentication enabled successfully',
		'redirect': '/login.html',
	});

};
