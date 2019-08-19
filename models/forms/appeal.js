'use strict';

const { Bans } = require(__dirname+'/../../db/');

module.exports = async (req, res, next) => {

	return Bans.appeal(res.locals.ip, req.body.checkedbans, req.body.message).then(r => r.modifiedCount);

}
