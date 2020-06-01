'use strict';

const Bans = require(__dirname+'/../../../db/bans.js');

module.exports = async (req, res, next) => {

	let bans;
	try {
		bans = await Bans.getBoardBans(req.params.board);
	} catch (err) {
		return next(err)
	}

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('managebans', {
		csrf: req.csrfToken(),
		bans,
	});

}
