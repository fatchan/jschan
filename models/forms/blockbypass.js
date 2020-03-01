'use strict';

const { Bypass } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, { secureCookies, blockBypass } = require(__dirname+'/../../configs/main.js')
	, production = process.env.NODE_ENV === 'production';

module.exports = async (req, res, next) => {

	const bypass = await Bypass.getBypass();
	const bypassId = bypass.insertedId;
	res.locals.blockBypass = bypass.ops[0];

	res.cookie('bypassid', bypassId.toString(), {
		'maxAge': blockBypass.expireAfterTime,
		'secure': production && secureCookies,
		'sameSite': 'strict'
	});
	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': 'Completed block bypass, you may go back and make your post.',
	});

}
