'use strict';

const { Bans } = require(__dirname+'/../../db/');

module.exports = async (req) => {

	//New ban expiry date is current date + ban_duration. Not based on the original ban issue date.
	const newExpireAt = new Date(Date.now() + req.body.ban_duration);
	return Bans.editDuration(req.params.board, req.body.checkedbans, newExpireAt).then(result => result.modifiedCount);

};
