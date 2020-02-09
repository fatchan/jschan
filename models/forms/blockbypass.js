'use strict';

const { Bypass } = require(__dirname+'/../../db/')
	, { secureCookies, blockBypass } = require(__dirname+'/../../configs/main.js')
	, production = process.env.NODE_ENV === 'production';

module.exports = async (req, res, next) => {

	const bypassId = await Bypass.getBypass();

	return res
		.cookie('bypassid', bypassId.toString(), {
			'maxAge': blockBypass.expireAfterTime,
			'secure': production && secureCookies,
			'sameSite': 'strict'
		})
		.render('message', {
			'title': 'Success',
			'message': 'Completed block bypass, you may go back and make your post.',
		});

}
