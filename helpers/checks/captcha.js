'use strict';

const { Captchas } = require(__dirname+'/../../db/')
    , { ObjectId } = require(__dirname+'/../../db/db.js')
    , { captchaOptions } = require(__dirname+'/../../configs/main.js')
	, FormData = require('form-data')
	, fetch = require('node-fetch')
	, { timingSafeEqual } = require('crypto')

module.exports = async (captchaInput, captchaId) => {

	//check if captcha field in form is valid
	if (!captchaInput /* || (captchaInput.length !== 6 && !captchaOptions.google.enabled)*/) {
		throw 'Incorrect captcha answer';
	}

	//make sure they have captcha cookie and its 24 chars
	if (!captchaOptions.google.enabled && (!captchaId || captchaId.length !== 24)) {
		throw 'Captcha expired';
	}

	if (!captchaOptions.google.enabled) { //using builtin captcha
		// try to get the captcha from the DB
		const captchaMongoId = ObjectId(captchaId);
		captchaInput = Array.isArray(captchaInput) ? captchaInput : [captchaInput];
		const normalisedAnswer = new Array(captchaOptions.gridSize**2).fill(false);
		captchaInput.forEach(num => {
			normalisedAnswer[+num] = true;
		});
		let captcha = await Captchas.findOneAndDelete(captchaMongoId, normalisedAnswer);
		//check that it exists and matches captcha in DB
		if (!captcha || !captcha.value
			|| !timingSafeEqual(Buffer.from(captcha.value.answer.join(',')), Buffer.from(normalisedAnswer.join(',')))) {
			throw 'Incorrect captcha answer';
		}
 	} else { //using google recaptcha
		//get a response from google
		let recaptchaResponse;
		try {
			const form = new FormData();
			form.append('secret', captchaOptions.google.secretKey);
			form.append('response', captchaInput);
			recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
				method: 'POST',
				body: form,
			}).then(res => res.json());
		} catch (e) {
			throw 'Captcha error occurred';
			//no special error, user will jsut get captcha failed error
		}
		if (!recaptchaResponse || !recaptchaResponse.success) {
			throw 'Incorrect captcha answer';
		}
	}

	return true;

}
