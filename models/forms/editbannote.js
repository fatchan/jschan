'use strict';

const { Bans } = require(__dirname+'/../../db/');

module.exports = async (req, res) => {

	//New ban note.
	return Bans.editNote(res.locals.bansBoard, req.body.checkedbans, req.body.ban_note).then(result => result.modifiedCount);

};
