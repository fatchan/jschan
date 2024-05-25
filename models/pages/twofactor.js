'use strict';

const redis = require(__dirname+'/../../lib/redis/redis.js')
	, { Ratelimits } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, OTPAuth = require('otpauth')
	, QRCode = require('qrcode');

module.exports = async (req, res, next) => {

	if (res.locals.user.twofactor) {
		// User already has 2fa enabled
		return res.redirect('/account.html');
	}

	// Ratelimit QR code generation
	const username = res.locals.user.username;
	const ratelimit = await Ratelimits.incrmentQuota(username, '2fa', 10);
	if (ratelimit > 100) {
		const { __ } = res.locals;
		return dynamicResponse(req, res, 429, 'message', {
			'title': __('Ratelimited'),
			'message': __('Please wait before generating another 2FA QR code.'),
		});
	}

	const { meta } = config.get;

	let qrCodeText = ''
		, secretBase32 = '';
	try {
		const totp = new OTPAuth.TOTP({
			issuer: meta.url || 'jschan',
			label: meta.siteName || 'jschan',
			algorithm: 'SHA256',
		});
		const secret = totp.secret;
		secretBase32 = secret.base32;
		await redis.set(`twofactor_tempsecret:${username}`, secretBase32, 300); //store validation secret temporarily in redis
		const qrCodeURL = totp.toString();
		qrCodeText = await QRCode.toString(qrCodeURL, { type: 'utf8' });
	} catch (err) {
		return next(err);
	}

	res
		.set('Cache-Control', 'no-cache')
		.render('twofactor', {
			csrf: req.csrfToken(),
			qrCodeText,
			secretBase32,
		});

};
