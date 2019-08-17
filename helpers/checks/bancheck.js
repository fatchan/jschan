'use strict';

const { Bans } = require(__dirname+'/../../db/')
	, hasPerms = require(__dirname+'/hasperms.js');

module.exports = async (req, res, next) => {

	if (res.locals.permLevel > 1) {//global staff or admin bypass
		const bans = await Bans.find(res.locals.ip, res.locals.board ? res.locals.board._id : null);
		if (bans && bans.length > 0) {
			const globalBans = bans.filter(ban => { return board === null });
			if (globalBans.length > 0 || (res.locals.permLevel >= 4 && globalBans.length !== bans.length)) {
				//board staff bypass bans on their own board, but not global bans
				return res.status(403).render('ban', {
					bans: bans
				});
			}
		}
	}
	next();

}
