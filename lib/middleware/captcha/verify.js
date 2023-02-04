'use strict';

const { Ratelimits } = require(__dirname+'/../../../db/')
	, checkCaptcha = require(__dirname+'/../../captcha/captcha.js')
	, config = require(__dirname+'/../../misc/config.js')
	, remove = require('fs-extra').remove
	, dynamicResponse = require(__dirname+'/../../misc/dynamic.js')
	, deleteTempFiles = require(__dirname+'/../../file/deletetempfiles.js')
	, uploadDirectory = require(__dirname+'/../../file/uploaddirectory.js')
	, { Permissions } = require(__dirname+'/../../permission/permissions.js');

module.exports = async (req, res, next) => {

	//bypass captcha permission
	if (res.locals.permissions &&
		res.locals.permissions.get(Permissions.BYPASS_CAPTCHA)) {
		res.locals.solvedCaptcha = true;
		return next();
	}

	//skip captcha if disabled on board for posts only
	if (res.locals.board
		&& req.path === `/board/${res.locals.board._id}/post`) {
		if (res.locals.board.settings.captchaMode === 0 //if captcha disabled
			|| (res.locals.board.settings.captchaMode === 1 && req.body.thread)) { //or if enabled for threads, and not a thread
			return next(); //then skip checking captcha
		}
	}

	const captchaInput = req.body.captcha || req.body['g-recaptcha-response'] || req.body['h-captcha-response'];
	const captchaId = req.cookies.captchaid;
	try {
		await checkCaptcha(captchaInput, captchaId);
	} catch (err) {
		deleteTempFiles(req).catch(console.error);
		if (err instanceof Error) {
			return next(err);
		}
		const page = (req.body.minimal || req.path === '/blockbypass' ? 'bypass' : 'message');
		const { __ } = res.locals;
		return dynamicResponse(req, res, 403, page, {
			'title': __('Forbidden'),
			'message': __(err),
			'redirect': req.headers.referer,
		});
	}

	//it was correct, so mark as solved for other middleware
	res.locals.solvedCaptcha = true;

	const { captchaOptions } = config.get;
	if (captchaOptions.type !== 'google' && captchaOptions.type !== 'hcaptcha') {
		//for builtin captchas, clear captchaid cookie, delete file and reset quota
		res.clearCookie('captchaid');
		await Promise.all([
			!res.locals.anonymizer && Ratelimits.resetQuota(res.locals.ip.cloak, 'captcha'),
			remove(`${uploadDirectory}/captcha/${captchaId}.jpg`)
		]);
	}

	//completed captcha successfully, continue
	return next();

};
