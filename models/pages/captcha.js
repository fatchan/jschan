'use strict';

const Captchas = require(__dirname+'/../../db/captchas.js')
	, generateCaptcha = require(__dirname+'/../../helpers/captchagenerate.js');

module.exports = async (req, res, next) => {

	let captchaId;
	try {
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
			'sameSite': 'lax'
		})
		.redirect(`/captcha/${captchaId}.jpg`);

}
