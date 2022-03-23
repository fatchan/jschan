'use strict';

const { Bans } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../dynamic.js')
	, Permissions = require(__dirname+'/../permissions.js');

module.exports = async (req, res, next) => {

	//bypass all bans, special permission
	if (res.locals.permissions.get(Permissions.BYPASS_BANS)) {
		return next();
	}

	//fetch bans
	const banBoard = res.locals.board ? res.locals.board._id : null; //if no board, global bans or "null" board.
	let bans = await Bans.find(res.locals.ip, banBoard);
	//board staff still bypass bans on their board by default
	if (res.locals.permissions.get(Permissions.MANAGE_BOARD_GENERAL)) {
		//filter bans to leave only global bans remaining
		bans = bans.filter(ban => ban.board !== res.locals.board);
	}
	if (bans && bans.length > 0) {
		const unseenBans = bans.filter(b => !b.seen).map(b => b._id);
		await Bans.markSeen(unseenBans); //mark bans as seen
		bans.forEach(ban => ban.seen = true); //mark seen as true in memory for user viewed ban page
		//todo: make a dynamicresponse, handle in frontend modal.
		return res.status(403).render('ban', {
			bans: bans,
		});
	}

	next(); //no bans found

}
