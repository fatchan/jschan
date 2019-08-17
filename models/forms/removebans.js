'use strict';

const { Bans } = require(__dirname+'/../../db/');

module.exports = async (req, res, next) => {

	return Bans.removeMany(req.params.board, req.body.checkedbans).then(result => result.deletedCount);

}
