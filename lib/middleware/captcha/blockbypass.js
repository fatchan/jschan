'use strict';

const { Bypass } = require(__dirname+'/../../../db/')
	, { ObjectId } = require(__dirname+'/../../../db/db.js')
	, config = require(__dirname+'/../../misc/config.js')
	, deleteTempFiles = require(__dirname+'/../../file/deletetempfiles.js')
	, dynamicResponse = require(__dirname+'/../../misc/dynamic.js')
	, production = process.env.NODE_ENV === 'production'
	, Permissions = require(__dirname+'/../../permission/permissions.js');

module.exports = {

	check: async (req, res, next) => {

		const { secureCookies, blockBypass } = config.get;

		//bypass captcha permission
		if (res.locals.permissions &&
			res.locals.permissions.get(Permissions.BYPASS_CAPTCHA)) {
			res.locals.solvedCaptcha = true;
		}

		//check if blockbypass exists and right length
		const bypassId = req.signedCookies.bypassid;
		if (!res.locals.solvedCaptcha && (!bypassId || bypassId.length !== 24)) {
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

		//try to get bypass from db
		let bypass;
		if (bypassId && bypassId.length === 24) {
			try {
				const bypassMongoId = ObjectId(bypassId);
				bypass = await Bypass.checkBypass(bypassMongoId, res.locals.anonymizer);
			} catch (err) {
				return next(err);
			}
		}

		//next if they have a valid bypass
		if (bypass != null) {
			res.locals.blockBypass = true;				
			return next();
		}

		if (res.locals.solvedCaptcha) {
			//they dont have a valid bypass, but just solved board captcha, so give them a new one
			const newBypass = await Bypass.getBypass(res.locals.anonymizer, res.locals.pseudoIp, blockBypass.expireAfterUses);
			const newBypassId = newBypass.upsertedId || newBypass.insertedId || res.locals.pseudoIp;
			res.locals.blockBypass = true;
			res.cookie('bypassid', newBypassId.toString(), {
				'maxAge': blockBypass.expireAfterTime,
				'secure': production && secureCookies && (req.headers['x-forwarded-proto'] === 'https'),
				'sameSite': 'strict',
				'signed': true
			});
			return next();
		}

		deleteTempFiles(req).catch(console.error);
		res.clearCookie('bypassid');
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': 'Block bypass expired or exceeded max uses',
			'frame': '/bypass_minimal.html',
			'link': {
				'href': '/bypass.html',
				'text': 'Get block bypass',
			},
		});

	},

	middleware: async (req, res, next) => {
		const { blockBypass, secureCookies } = config.get;
		//skip bypass check if not enabled, and not forced for anonymizer or we arent an anonymizer
		if (!blockBypass.enabled &&
			(!blockBypass.forceAnonymizers || !res.locals.anonymizer)) {
			if (res.locals.anonymizer) {
				//dummy for anonymizers, wont work once bypasses are enabled. just allows them to keep same ip/userId for session
				res.cookie('bypassid', res.locals.pseudoIp, {
					'maxAge': blockBypass.expireAfterTime,
					'secure': production && secureCookies && (req.headers['x-forwarded-proto'] === 'https'),
					'sameSite': 'strict',
					'signed': true
				});	
			}
			return next();
		}
		return module.exports.check(req, res, next);
	},

};
