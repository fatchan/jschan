'use strict';

const { Bans } = require(__dirname+'/../../../db/');

module.exports = async (req, res, next) => {

	let bans;
	try {
		bans = await Bans.getGlobalBans();
	} catch (err) {
		return next(err)
	}

	res.render('globalmanagebans', {
		csrf: req.csrfToken(),
		bans,
	});

}
