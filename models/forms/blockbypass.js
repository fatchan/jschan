'use strict';

const { Bypass } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, { secureCookies, blockBypass } = require(__dirname+'/../../configs/main.js')
	, production = process.env.NODE_ENV === 'production';

module.exports = async (req, res, next) => {

	const bypass = await Bypass.getBypass();
	const bypassId = bypass.insertedId;
	res.locals.blockBypass = bypass.ops[0];

	return res
		.cookie('bypassid', bypassId.toString(), {
			'maxAge': blockBypass.expireAfterTime,
			'secure': production && secureCookies,
			'sameSite': 'strict'
		})
		.render('message', {
			'minimal': req.body.minimal, //todo: make use x- header for ajax once implm.
			'title': 'Success',
			'message': 'Completed block bypass, you may go back and make your post.',
		});

}
