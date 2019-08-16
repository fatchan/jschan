'use strict';

const { Captchas, Ratelimits } = require(__dirname+'/../../db/')
	, generateCaptcha = require(__dirname+'/../../helpers/captcha/captchagenerate.js');

module.exports = async (req, res, next) => {

	let captchaId;
	try {
		const ratelimit = await Ratelimits.incrmentQuota(res.locals.ip, 10);
		if (ratelimit > 100) {
			return res.status(429).redirect('/img/ratelimit.png');
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
