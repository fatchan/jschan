'use strict';

const redis = require(__dirname+'/../../lib/redis/redis.js')
	, { Ratelimits } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, speakeasy = require('speakeasy')
	, QRCode = require('qrcode');

module.exports = async (req, res, next) => {

	if (res.locals.user.twofactor) {
		// User already has 2fa enabled
		return res.redirect('/account.html');
	}

	// Ratelimit QR code generation
	const username = res.locals.user.username;
	const ratelimit = await Ratelimits.incrmentQuota(username, '2fa', 50);
	if (false && ratelimit > 100) {
		return dynamicResponse(req, res, 429, 'message', {
			'title': 'Ratelimited',
			'message': 'Please wait before generating another 2FA QR code.',
		});
	}

	let qrCodeText = '';
	try {
		const secret = speakeasy.generateSecret();
		const secretBase32 = secret.base32;
		await redis.set(`twofactor:${username}`, secretBase32, 300); //store validation secret temporarily in redis
		qrCodeText = await QRCode.toString(secret.otpauth_url, { type: 'utf8' });
	} catch (err) {
		return next(err);
	}

	res
		.set('Cache-Control', 'private, max-age=5')
		.render('twofactor', {
			csrf: req.csrfToken(),
			qrCodeText, 
		});

};
