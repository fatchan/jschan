'use strict';

const hasPerms = require(__dirname+'/hasperms.js');

module.exports = (req, res, next) => {
	res.locals.permLevel = hasPerms(req, res);
	next();
}
