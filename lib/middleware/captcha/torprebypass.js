'use strict';

const { Bypass } = require(__dirname+'/../../../db/')
	, config = require(__dirname+'/../../misc/config.js')
	, checkCaptcha = require(__dirname+'/../../captcha/captcha.js')
	, remove = require('fs-extra').remove
	, uploadDirectory = require(__dirname+'/../../file/uploaddirectory.js')
	, dynamicResponse = require(__dirname+'/../../misc/dynamic.js')
	, deleteTempFiles = require(__dirname+'/../../file/deletetempfiles.js')
	, production = process.env.NODE_ENV === 'production';

module.exports = async (req, res, next) => {

	//early bypass is only needed for anonymizer users
	if (!res.locals.anonymizer) {
		return next();
	}

	let bypassId = req.signedCookies.bypassid;
	console.log('torprebypass', bypassId);

	const { secureCookies, blockBypass } = config.get;
	if (blockBypass.enabled || blockBypass.forceAnonymizers) {
		const input = req.body.captcha;
		const captchaId = req.cookies.captchaid;
		if (input && !bypassId) {
			// try to get the captcha from the DB
			try {
				await checkCaptcha(input, captchaId);
			} catch (err) {
				deleteTempFiles(req).catch(console.error);
				if (err instanceof Error) {
					return next(err);
				}
				const page = (req.body.minimal || req.path === '/blockbypass' ? 'bypass' : 'message');
				return dynamicResponse(req, res, 403, page, {
					'title': 'Forbidden',
					'message': err,
					'redirect': req.headers.referer,
				});
			}
			res.locals.solvedCaptcha = true;
			res.clearCookie('captchaid');
			remove(`${uploadDirectory}/captcha/${captchaId}.jpg`).catch(e => { console.error(e); });
		}
	}

	if (res.locals.solvedCaptcha //if they just solved a captcha
		|| (!blockBypass.enabled //OR blockbypass isnt enabled
			&& !blockBypass.forceAnonymizers //AND its not forced for anonymizers
			&& !bypassId)) { //AND they dont already have one,
		//then give the user a bypass id
		const newBypass = await Bypass.getBypass(res.locals.anonymizer);
		const newBypassId = newBypass.insertedId;
		bypassId = newBypassId.toString();
		res.locals.preFetchedBypassId = bypassId;
		res.locals.blockBypass = true;
		res.cookie('bypassid', newBypassId.toString(), {
			'maxAge': blockBypass.expireAfterTime,
			'secure': production && secureCookies && (req.headers['x-forwarded-proto'] === 'https'),
			'sameSite': 'strict',
			'signed': true
		});
		return next();
	}

	//check if blockbypass exists and right length
	if (!bypassId || bypassId.length !== 24) {
		res.clearCookie('bypassid');
		deleteTempFiles(req).catch(console.error);
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

};
