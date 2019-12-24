'use strict';

const { Bans } = require(__dirname+'/../../db/')
	, hasPerms = require(__dirname+'/hasperms.js');

module.exports = async (req, res, next) => {

	if (res.locals.permLevel > 1) {//global staff or admin bypass
		const bans = await Bans.find(res.locals.ip, res.locals.board ? res.locals.board._id : null);
		if (bans && bans.length > 0) {
			const globalBans = bans.filter(ban => { return ban.board === null });
			if (globalBans.length > 0 || (res.locals.permLevel >= 4 && globalBans.length !== bans.length)) {
				//board staff bypass bans on their own board, but not global bans
				const allowAppeal = bans.filter(ban => ban.allowAppeal === true && !ban.appeal).length > 0;
				const unseenBans = bans.filter(b => !b.seen).map(b => b._id);
				await Bans.markSeen(unseenBans); //mark bans as seen
				bans.forEach(ban => ban.seen = true); //mark seen as true in memory for user viewed ban page
				return res.status(403).render('ban', {
					bans: bans,
					allowAppeal
				});
			}
		}
	}
	next();

}
