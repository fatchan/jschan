'use strict';

const crypto = require('crypto')
	, Captchas = require(__dirname+'/../../db/captchas.js')
	, generateCaptcha = require(__dirname+'/../../helpers/captchagenerate.js');

module.exports = async (req, res, next) => {

	//will move captcha cookie check to nginx at some point
	if (req.cookies.captchaid) {
		return res.redirect(`/captcha/${req.cookies.captchaid}.png`);
	}

	// if we got here, they dont have a cookie so we need to
	// gen a captcha, set their cookie and redirect to the captcha
	const text = crypto.randomBytes(20).toString('hex').substring(0,6);
	let captchaId;
	try {
		captchaId = await Captchas.insertOne(text).then(r => r.insertedId); //get id of document as filename and captchaid
		await generateCaptcha(text, captchaId);
	} catch (err) {
		return next(err);
	}

	return res
		.cookie('captchaid', captchaId, {
			'maxAge': 5*60*1000, //5 minute cookie
			'httpOnly': true
		})
		.redirect(`/captcha/${captchaId}.png`);

}
