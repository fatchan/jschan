'use strict';

const { Captchas } = require(__dirname+'/../../db/')
    , { ObjectId } = require(__dirname+'/../../db/db.js')
    , { captchaOptions } = require(__dirname+'/../../configs/main.js')
	, FormData = require('form-data')
	, fetch = require('node-fetch')
	, { timingSafeEqual } = require('crypto')

module.exports = async (captchaInput, captchaId) => {

	//check if captcha field in form is valid
	if (!captchaInput
		|| (captchaInput.length !== 6 && !captchaOptions.type === 'text')) {
		throw 'Incorrect captcha answer';
	}

	//make sure they have captcha cookie and its 24 chars
	if ((captchaOptions.type !== 'google' && captchaOptions.type !== 'hcaptcha')
		&& (!captchaId || captchaId.length !== 24)) {
		throw 'Captcha expired';
	}

	captchaInput = Array.isArray(captchaInput) ? captchaInput : [captchaInput];

	switch (captchaOptions.type) {
		case 'grid': //grid captcha
			const gridCaptchaMongoId = ObjectId(captchaId);
			const normalisedAnswer = new Array(captchaOptions.grid.size**2).fill(false);
			captchaInput.forEach(num => {
				normalisedAnswer[+num] = true;
			});
			let gridCaptcha = await Captchas.findOneAndDelete(gridCaptchaMongoId, normalisedAnswer);
			if (!gridCaptcha || !gridCaptcha.value
				|| !timingSafeEqual(
					Buffer.from(gridCaptcha.value.answer.join(',')),
					Buffer.from(normalisedAnswer.join(','))
				)
			) {
				throw 'Incorrect captcha answer';
			}
			break;
		case 'text': //text captcha
			const textCaptchaMongoId = ObjectId(captchaId);
			let textCaptcha = await Captchas.findOneAndDelete(textCaptchaMongoId, captchaInput[0]);
			if (!textCaptcha || !textCaptcha.value
				|| !timingSafeEqual(
					Buffer.from(textCaptcha.value.answer),
					Buffer.from(captchaInput[0])
				)
			) {
				throw 'Incorrect captcha answer';
			}
			break;
		case 'google': //google captcha
			let recaptchaResponse;
			try {
				const form = new FormData();
				form.append('secret', captchaOptions.google.secretKey);
				form.append('response', captchaInput[0]);
				recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
					method: 'POST',
					body: form,
				}).then(res => res.json());
			} catch (e) {
				throw 'Captcha error occurred';
			}
			if (!recaptchaResponse || !recaptchaResponse.success) {
				throw 'Incorrect captcha answer';
			}
			break;
		case 'hcaptcha':
			let hcaptchaResponse;
			try {
				const form = new FormData();
				form.append('secret', captchaOptions.hcaptcha.secretKey);
				form.append('sitekey', captchaOptions.hcaptcha.siteKey);
				form.append('response', captchaInput[0]);
				hcaptchaResponse = await fetch('https://hcaptcha.com/siteverify', {
					method: 'POST',
					body: form,
				}).then(res => res.json());
			} catch (e) {
				throw 'Captcha error occurred';
			}
			if (!hcaptchaResponse || !hcaptchaResponse.success) {
				throw 'Incorrect captcha answer';
			}
			break;
		default:
			throw 'Captcha config error';
			break;
	}

	return true;

}
