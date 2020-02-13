'use strict';

const Bans = require(__dirname+'/../../../db/bans.js')
	, { ipHashMode } = require(__dirname+'/../../../configs/main.js')
	, hashIp = require(__dirname+'/../../../helpers/haship.js');

module.exports = async (req, res, next) => {

	let bans;
	try {
		bans = await Bans.getBoardBans(req.params.board);
	} catch (err) {
		return next(err)
	}
	if (ipHashMode === 1 && res.locals.permLevel > 1) {
		for (let i = 0; i < bans.length; i++) {
			bans[i].ip = hashIp(bans[i].ip);
		}
	}

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('managebans', {
		csrf: req.csrfToken(),
		bans,
	});

}
