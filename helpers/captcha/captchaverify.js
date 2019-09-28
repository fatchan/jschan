'use strict';

const { Captchas, Ratelimits } = require(__dirname+'/../../db/')
	, { ObjectId } = require(__dirname+'/../../db/db.js')
	, remove = require('fs-extra').remove
	, dynamicResponse = require(__dirname+'/../dynamic.js')
	, uploadDirectory = require(__dirname+'/../files/uploadDirectory.js');

module.exports = async (req, res, next) => {

	//skip captcha if disabled on board for posts only
	if (res.locals.board
		&& req.path === `/board/${res.locals.board._id}/post`) {
		if (res.locals.board.settings.captchaMode === 0 //if captcha disabled
			|| (res.locals.board.settings.captchaMode === 1 && req.body.thread)) { //or if enabled for threads, and not a thread
			return next(); //then skip checking captcha
		}
	}

	//check if captcha field in form is valid
	const input = req.body.captcha;
	if (!input || input.length !== 6) {
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': 'Incorrect captcha'
		});
	}

	//make sure they have captcha cookie and its 24 chars
	const captchaId = req.cookies.captchaid;
	if (!captchaId || captchaId.length !== 24) {
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': 'Captcha expired'
		});
	}

	// try to get the captcha from the DB
	let captcha;
	try {
		const captchaMongoId = ObjectId(captchaId);
		captcha = await Captchas.findOneAndDelete(captchaMongoId, input);
	} catch (err) {
		return next(err);
	}

	//check that it exists and matches captcha in DB
	if (!captcha || !captcha.value || captcha.value.text !== input) {
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': 'Incorrect captcha'
		});
	}

	//it was correct, so delete the file, the cookie and reset their quota
	res.clearCookie('captchaid');
	await Promise.all([
		Ratelimits.resetQuota(res.locals.ip),
		remove(`${uploadDirectory}captcha/${captchaId}.jpg`)
	]);

	return next();

}
