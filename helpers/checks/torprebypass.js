'use strict';

const { Bypass, Captchas } = require(__dirname+'/../../db/')
	, { ObjectId } = require(__dirname+'/../../db/db.js')
	, { secureCookies, blockBypass } = require(__dirname+'/../../configs/main.js')
	, remove = require('fs-extra').remove
	, uploadDirectory = require(__dirname+'/../files/uploadDirectory.js')
	, dynamicResponse = require(__dirname+'/../dynamic.js')
	, production = process.env.NODE_ENV === 'production';

module.exports = async (req, res, next) => {

console.log('TOR PRE BYPASS')
	//early byapss is only needed for tor users
	if (!res.locals.tor) {
		return next();
	}

	//for captcha in existing form (NOTE: wont work for multipart forms yet)
	const input = req.body.captcha;
	if (input && input.length !== 6) {
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': 'Incorrect captcha answer',
			'redirect': req.headers.referer,
		});
	}
	const captchaId = req.cookies.captchaid;
	if (input) {
		// try to get the captcha from the DB
		let captcha;
		try {
			const captchaMongoId = ObjectId(captchaId);
			captcha = await Captchas.findOneAndDelete(captchaMongoId, input);
		} catch (err) {
			return next(err);
		}
		if (captcha && captcha.value && captcha.value.text === input) {
			res.locals.solvedCaptcha = true;
			res.clearCookie('captchaid');
			remove(`${uploadDirectory}/captcha/${captchaId}.jpg`).catch(e => { console.error(e) });
		} else {
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
	const bypassId = req.signedCookies.bypassid;
	if (!bypassId || bypassId.length !== 24) {
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

console.log('in tor pre bypass', bypassId)
	return next();

}
