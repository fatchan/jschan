'use strict';

const { Captchas, Ratelimits } = require(__dirname+'/../../db/')
	, { captchaOptions } = require(__dirname+'/../../configs/main.js')
	, FormData = require('form-data')
	, { ObjectId } = require(__dirname+'/../../db/db.js')
	, fetch = require('node-fetch')
	, remove = require('fs-extra').remove
	, dynamicResponse = require(__dirname+'/../dynamic.js')
	, deleteTempFiles = require(__dirname+'/../files/deletetempfiles.js')
	, uploadDirectory = require(__dirname+'/../files/uploadDirectory.js');

module.exports = async (req, res, next) => {

	const isBypass = req.path === '/blockbypass';

	//skip captcha if disabled on board for posts only
	if (res.locals.board
		&& req.path === `/board/${res.locals.board._id}/post`) {
		if (res.locals.board.settings.captchaMode === 0 //if captcha disabled
			|| (res.locals.board.settings.captchaMode === 1 && req.body.thread)) { //or if enabled for threads, and not a thread
			return next(); //then skip checking captcha
		}
	}

	//check if captcha field in form is valid
	const input = req.body.captcha || req.body['g-recaptcha-response'];
	if (!input || (input.length !== 6 && !captchaOptions.google.enabled)) {
		deleteTempFiles(req).catch(e => console.error);
		if (isBypass) {
			return res.status(403).render('bypass', {
				'minimal': req.body.minimal,
				'message': 'Incorrect captcha answer',
			});
		}
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': 'Incorrect captcha answer',
			'redirect': req.headers.referer,
		});
	}

	if (!captchaOptions.google.enabled) {
		//make sure they have captcha cookie and its 24 chars
		const captchaId = req.cookies.captchaid;
		if (!captchaId || captchaId.length !== 24) {
			deleteTempFiles(req).catch(e => console.error);
			if (isBypass) {
				return res.status(403).render('bypass', {
					'minimal': req.body.minimal,
					'message': 'Captcha expired',
				});
			}
			return dynamicResponse(req, res, 403, 'message', {
				'title': 'Forbidden',
				'message': 'Captcha expired',
				'redirect': req.headers.referer,
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

		if (!captcha || !captcha.value || captcha.value.text !== input) {
			deleteTempFiles(req).catch(e => console.error);
			if (isBypass) {
				return res.status(403).render('bypass', {
					'minimal': req.body.minimal,
					'message': 'Incorrect captcha answer',
				});
			}
			return dynamicResponse(req, res, 403, 'message', {
				'title': 'Forbidden',
				'message': 'Incorrect captcha answer',
				'redirect': req.headers.referer,
			});
		}

		//it was correct, so delete the file, the cookie and reset their quota
		res.locals.solvedCaptcha = true;
		res.clearCookie('captchaid');
		await Promise.all([
			Ratelimits.resetQuota(res.locals.ip.single, 'captcha'),
			remove(`${uploadDirectory}/captcha/${captchaId}.jpg`)
		]);

 	} else {
		//using google recaptcha
		let recaptchaResponse;
		try {
			const form = new FormData();
			form.append('secret', captchaOptions.google.secretKey);
			form.append('response', input);
			recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
				method: 'POST',
				body: form,
			}).then(res => res.json());
		} catch (e) {
			//no special error, user will jsut get captcha failed error
		}
		if (!recaptchaResponse || !recaptchaResponse.success) {
			//not sure if hostname and timestamp checks are needed here
			if (isBypass) {
				return res.status(403).render('bypass', {
					'minimal': req.body.minimal,
					'message': 'Incorrect captcha answer',
				});
			}
			return dynamicResponse(req, res, 403, 'message', {
				'title': 'Forbidden',
				'message': 'Incorrect captcha answer',
				'redirect': req.headers.referer,
			});
		}

		res.locals.solvedCaptcha = true;

	}

	return next();

}
