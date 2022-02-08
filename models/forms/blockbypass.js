'use strict';

const { Bypass } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, config = require(__dirname+'/../../config.js')
	, production = process.env.NODE_ENV === 'production';

module.exports = async (req, res, next) => {

	const { secureCookies, blockBypass } = config.get;
	const bypass = await Bypass.getBypass(res.locals.anonymizer);
	const bypassId = bypass.insertedId;
	res.locals.blockBypass = true;

	res.cookie('bypassid', bypassId.toString(), {
		'maxAge': blockBypass.expireAfterTime,
		'secure': production && secureCookies && (req.headers['x-forwarded-proto'] === 'https'),
		'sameSite': 'strict',
		'signed': true,
	})

	return dynamicResponse(req, res, 200, 'message', {
		'minimal': req.body.minimal,
		'title': 'Success',
		'message': 'Completed block bypass, you may go back and make your post.',
	});

}
