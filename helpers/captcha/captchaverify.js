'use strict';

const { Ratelimits } = require(__dirname+'/../../db/')
	, { ObjectId } = require(__dirname+'/../../db/db.js')
	, checkCaptcha = require(__dirname+'/../checks/captcha.js')
	, remove = require('fs-extra').remove
	, dynamicResponse = require(__dirname+'/../dynamic.js')
	, deleteTempFiles = require(__dirname+'/../files/deletetempfiles.js')
	, uploadDirectory = require(__dirname+'/../files/uploadDirectory.js');

module.exports = async (req, res, next) => {

	//already solved in pre stage for getting bypassID for "ip"
	if (res.locals.tor && res.locals.solvedCaptcha) {
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

	try {
		await checkCaptcha(req.body.captcha, req.cookies.captchaid);
	} catch (err) {
		deleteTempFiles(req).catch(e => console.error);
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

	//it was correct, so delete the file, the cookie and reset their quota
	res.locals.solvedCaptcha = true;
	res.clearCookie('captchaid');
	await Promise.all([
		!res.locals.tor && Ratelimits.resetQuota(res.locals.ip.single, 'captcha'),
		remove(`${uploadDirectory}/captcha/${req.cookies.captchaid}.jpg`)
	]);

	return next();

}
