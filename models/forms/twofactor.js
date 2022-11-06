'use strict';

const redis = require(__dirname+'/../../lib/redis/redis.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, { Accounts } = require(__dirname+'/../../db/')
	, speakeasy = require('speakeasy');

module.exports = async (req, res) => {

	const username = res.locals.user.username.toLowerCase();

	// Get the temporary secret from redis and check it exists
	const tempSecret = await redis.get(`twofactor:${username}`);
	if (!tempSecret) {
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': '2FA QR code expired, try again',
			'redirect': '/twofactor.html',
		});
	}

	// bcrypt compare input to saved hash
	const verified = await speakeasy.totp.verify({
		secret: tempSecret,
		encoding: 'base32',
		token: req.body.twofactor,
	});

	//if hashes matched
	if (verified === false) {
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': 'Incorrect 2FA code',
			'redirect': '/twofactor.html',
		});
	}
	redis.del(`twofactor:${username}`);
	
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
