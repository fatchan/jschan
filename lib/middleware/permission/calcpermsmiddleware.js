'use strict';

const calcPerms = require(__dirname+'/calcperms.js');

module.exports = (req, res, next) => {
	res.locals.permissions = calcPerms(req, res);
	next();
}
