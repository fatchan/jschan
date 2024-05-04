'use strict';

const { Bans } = require(__dirname+'/../../db/');

module.exports = async (req, res) => {

	return Bans.denyAppeal(res.locals.bansBoard, req.body.checkedbans).then(result => result.modifiedCount);

};
