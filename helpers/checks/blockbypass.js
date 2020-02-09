'use strict';

const { Bypass } = require(__dirname+'/../../db/')
	, { ObjectId } = require(__dirname+'/../../db/db.js')
	, { blockBypass } = require(__dirname+'/../../configs/main.js')
	, dynamicResponse = require(__dirname+'/../dynamic.js');

module.exports = async (req, res, next) => {

	if (!blockBypass.enabled) {
		return next();
	}

	//check if blockbypass exists and right length
	const bypassId = req.cookies.bypassid;
	if (!bypassId || bypassId.length !== 24) {
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': 'Missing or invalid block bypass',
			'redirect': '/bypass.html',
			'link': '/bypass.html',
		});
	}

	//try to get bypass from db and make sure uses < maxUses
	let bypass;
	try {
		const bypassMongoId = ObjectId(bypassId);
		bypass = await Bypass.checkBypass(bypassMongoId);
	} catch (err) {
		return next(err);
	}

	if (!bypass) {
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': 'Invalid or expired block bypass',
			'redirect': '/bypass.html',
			'link': '/bypass.html',
		});
	} else if (bypass.uses >= blockBypass.expireAfterUses) {
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': 'Block bypass exceeded max uses',
			'redirect': '/bypass.html',
			'link': '/bypass.html',
		});
	}

	return next();

}
