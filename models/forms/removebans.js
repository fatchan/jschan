'use strict';

const Bans = require(__dirname+'/../../db/bans.js')
	, { ObjectId } = require('mongodb');

module.exports = async (req, res, next) => {

	const banIds = req.body.checkedbans.map(ObjectId);
	const removedBans = await Bans.removeMany(req.params.board, banIds).then(result => result.deletedCount);

	return `Removed ${removedBans} bans`;

}
