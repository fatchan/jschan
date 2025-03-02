'use strict';

const { NftRules } = require(__dirname+'/../../../db/');

module.exports = async (req, res, next) => {

	let nftRule;
	try {
		nftRule = await NftRules.findOne(req.params.board, req.params.nftruleid);
	} catch (err) {
		return next(err);
	}

	if (!nftRule) {
		return next();
	}

	res
		.set('Cache-Control', 'private, max-age=5')
		.render('editnftrule', {
			csrf: req.csrfToken(),
			permissions: res.locals.permissions,
			nftRule,
		});

};
