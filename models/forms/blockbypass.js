'use strict';

const { Bypass } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, production = process.env.NODE_ENV === 'production';

module.exports = async (req, res) => {

	const { __ } = res.locals;
	const { secureCookies, blockBypass } = config.get;
	const existingBypassId = req.signedCookies.bypassid || res.locals.pseudoIp;
	const bypass = await Bypass.getBypass(res.locals.anonymizer, existingBypassId, blockBypass.expireAfterUses);
	const bypassId = bypass.upsertedId || bypass.insertedId || existingBypassId;
	res.locals.blockBypass = true;

	res.cookie('bypassid', bypassId.toString(), {
		'maxAge': blockBypass.expireAfterTime,
		'secure': production && secureCookies && (req.headers['x-forwarded-proto'] === 'https'),
		'sameSite': 'strict',
		'signed': true,
	});

	return dynamicResponse(req, res, 200, 'message', {
		'minimal': req.body.minimal,
		'title': __('Success'),
		'message': __('Completed block bypass, you may go back and make your post.'),
	});

};
