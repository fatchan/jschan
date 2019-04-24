'use strict';

const Captchas = require(__dirname+'/../db/captchas.js')
	, Mongo = require(__dirname+'/../db/db.js')
	, util = require('util')
	, fs = require('fs')
	, unlink = util.promisify(fs.unlink)
	, uploadDirectory = require(__dirname+'/../helpers/uploadDirectory.js');

module.exports = async (req, res, next) => {

	//check if captcha field in form is valid
	const input = req.body.captcha;
	if (!input || input.length !== 6) {
		return res.status(403).render('message', {
			'title': 'Forbidden',
			'message': 'Incorrect captcha'
		});
	}

	//make sure they have captcha cookie and its 24 chars
	const captchaId = req.cookies.captchaid;
	if (!captchaId || captchaId.length !== 24) {
		return res.status(403).render('message', {
			'title': 'Forbidden',
			'message': 'Captcha expired'
		});
	}


	// try to get the captcha from the DB
	let captcha;
	try {
		const captchaMongoId = Mongo.ObjectId(captchaId);
		captcha = await Captchas.findOneAndDelete(captchaMongoId, input);
	} catch (err) {
		return next(err);
	}

	//check that it exists and matches captcha in DB
	if (!captcha || !captcha.value || captcha.value.text !== input) {
		return res.status(403).render('message', {
			'title': 'Forbidden',
			'message': 'Incorrect captcha'
		});
	}

	//it was correct, so delete the file, the cookie and continue
	res.clearCookie('captchaid');
	await unlink(`${uploadDirectory}captcha/${captchaId}.png`)

	return next();

}
