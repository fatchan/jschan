'use strict';

const { Bans } = require(__dirname+'/../../db/');

module.exports = async (req, res) => {

	return Bans.appeal(res.locals.ip.cloak, req.body.checkedbans, req.body.message).then(r => r.modifiedCount);

};
