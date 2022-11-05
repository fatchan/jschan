'use strict';

const { Bans } = require(__dirname+'/../../db/');

module.exports = async (req) => {

	//New ban note.
	return Bans.editNote(req.params.board, req.body.checkedbans, req.body.ban_note).then(result => result.modifiedCount);

};
