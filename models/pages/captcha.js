'use strict';

const Captchas = require(__dirname+'/../../db/captchas.js')
	, generateCaptcha = require(__dirname+'/../../helpers/captcha/captchagenerate.js');

module.exports = async (req, res, next) => {

	let captchaId;
	try {
		const ratelimit = await Captchas.incrmentQuota(res.locals.ip);
		if (ratelimit > 12) { // 12 per minute = 1 per 5 seconds within a minute (with burst)
			return res.status(429).redirect(`/img/ratelimit.png`);
		}
		const text = Math.random().toString(36).substr(2,6);
		captchaId = await Captchas.insertOne(text).then(r => r.insertedId); //get id of document as filename and captchaid
		await generateCaptcha(text, captchaId);
	} catch (err) {
		return next(err);
	}

	return res
		.cookie('captchaid', captchaId.toString(), {
			'maxAge': 5*60*1000, //5 minute cookie
			'httpOnly': true,
			'secure': true,
			'sameSite': 'strict'
		})
		.redirect(`/captcha/${captchaId}.jpg`);

}
