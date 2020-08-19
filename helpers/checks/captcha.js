'use strict';

const { Captchas } = require(__dirname+'/../../db/')
    , { ObjectId } = require(__dirname+'/../../db/db.js')
	, { timingSafeEqual } = require('crypto')

module.exports = async (captchaInput, captchaId) => {

	//check if captcha field in form is valid
	if (!captchaInput || captchaInput.length !== 6) {
		throw 'Incorrect captcha answer';
	}

	//make sure they have captcha cookie and its 24 chars
	if (!captchaId || captchaId.length !== 24) {
		throw 'Captcha expired';
	}

	// try to get the captcha from the DB
	const captchaMongoId = ObjectId(captchaId);
	let captcha = await Captchas.findOneAndDelete(captchaMongoId, captchaInput);

	//check that it exists and matches captcha in DB
	if (!captcha || !captcha.value
		|| !timingSafeEqual(Buffer.from(captcha.value.text), Buffer.from(captchaInput))) {
		throw 'Incorrect captcha answer';
	}

	return true;

}
