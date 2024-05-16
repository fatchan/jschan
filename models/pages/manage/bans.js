'use strict';

const Bans = require(__dirname+'/../../../db/bans.js')
	, { Permissions } = require(__dirname+'/../../../lib/permission/permissions.js');

module.exports = async (req, res, next) => {

	let bans;
	try {
		const showGlobal = res.locals.permissions.get(Permissions.VIEW_BOARD_GLOBAL_BANS);
		const bansBoard = showGlobal ? req.params.board : { '$eq': req.params.board };
		bans = await Bans.getBoardBans(bansBoard);
	} catch (err) {
		return next(err);
	}

	res
		.set('Cache-Control', 'private, max-age=5')
		.render('managebans', {
			csrf: req.csrfToken(),
			permissions: res.locals.permissions,
			viewRawIp: res.locals.permissions.get(Permissions.VIEW_RAW_IP),
			bans,
		});

};
