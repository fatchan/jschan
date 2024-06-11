'use strict';

const { Bans } = require(__dirname+'/../../db/')
	, { Permissions } = require(__dirname+'/../../lib/permission/permissions.js');

module.exports = async (req, res) => {

	const showGlobal = res.locals.permissions.get(Permissions.VIEW_BOARD_GLOBAL_BANS);
	const bansBoard = req.params.board ? (showGlobal ? req.parms.board : { '$eq': req.params.board }) : null;
	return Bans.removeMany(bansBoard, req.body.checkedbans).then(result => result.deletedCount);

};
