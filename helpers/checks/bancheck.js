'use strict';

const Bans = require(__dirname+'/../../db/bans.js')
	, hasPerms = require(__dirname+'/hasperms.js');

module.exports = async (req, res, next) => {

	if (!hasPerms(req, res)) {
		const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
		const bans = await Bans.find(ip, res.locals.board ? res.locals.board._id : null);
		if (bans && bans.length > 0) {
			//TODO: show posts banned for, expiry, etc
			return res.status(403).render('ban', {
				bans: bans
			});
		}
	}
	next();

}
