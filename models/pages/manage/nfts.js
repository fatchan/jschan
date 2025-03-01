'use strict';

const { NftRules } = require(__dirname+'/../../../db/');

module.exports = async (req, res, next) => {

	let nftRules;
	try {
		nftRules = await NftRules.findForBoard(req.params.board);
	} catch (err) {
		return next(err);
	}

	res
		.set('Cache-Control', 'private, max-age=5')
		.render('managenfts', {
			csrf: req.csrfToken(),
			permissions: res.locals.permissions,
			nftRules,
		});

};
