'use strict';

const { Bypass, Captchas } = require(__dirname+'/../../db/')
	, { ObjectId } = require(__dirname+'/../../db/db.js')
	, { secureCookies, blockBypass } = require(__dirname+'/../../configs/main.js')
	, remove = require('fs-extra').remove
	, uploadDirectory = require(__dirname+'/../files/uploadDirectory.js')
	, dynamicResponse = require(__dirname+'/../dynamic.js')
	, deleteTempFiles = require(__dirname+'/../files/deletetempfiles.js')
	, production = process.env.NODE_ENV === 'production';

module.exports = async (req, res, next) => {

	//early byapss is only needed for tor users
	if (!res.locals.tor) {
		return next();
	}

	//for captcha in existing form (NOTE: wont work for multipart forms yet)
	const input = req.body.captcha;
	if (input && input.length !== 6) {
		deleteTempFiles(req).catch(e => console.error);
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': 'Incorrect captcha answer',
			'redirect': req.headers.referer,
		});
	}
	const captchaId = req.cookies.captchaid;
	let bypassId = req.signedCookies.bypassid;
	if (input && !bypassId) {
		// try to get the captcha from the DB
		let captcha;
		try {
			const captchaMongoId = ObjectId(captchaId);
			captcha = await Captchas.findOneAndDelete(captchaMongoId, input);
		} catch (err) {
			deleteTempFiles(req).catch(e => console.error);
			return next(err);
		}
		if (captcha && captcha.value && captcha.value.text === input) {
			res.locals.solvedCaptcha = true;
			res.clearCookie('captchaid');
			remove(`${uploadDirectory}/captcha/${captchaId}.jpg`).catch(e => { console.error(e) });
		} else {
			deleteTempFiles(req).catch(e => console.error);
			return dynamicResponse(req, res, 403, 'message', {
				'title': 'Forbidden',
				'message': 'Incorrect captcha answer',
				'redirect': req.headers.referer,
			});
		}
	}

	if (res.locals.solvedCaptcha) {
		//they dont have a valid bypass, but just solved a captcha, so give them a new one
		const newBypass = await Bypass.getBypass();
		const newBypassId = newBypass.insertedId;
		bypassId = newBypassId.toString();
		res.locals.preFetchedBypassId = bypassId;
		res.locals.blockBypass = newBypass.ops[0];
		res.cookie('bypassid', newBypassId.toString(), {
			'maxAge': blockBypass.expireAfterTime,
			'secure': production && secureCookies,
			'sameSite': 'strict',
			'signed': true
		});
		return next();
	}

	//check if blockbypass exists and right length
	if (!bypassId || bypassId.length !== 24) {
		deleteTempFiles(req).catch(e => console.error);
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': 'Please complete a block bypass to continue',
			'frame': '/bypass_minimal.html',
			'link': {
				'href': '/bypass.html',
				'text': 'Get block bypass',
			},
		});
	}

	return next();

}
