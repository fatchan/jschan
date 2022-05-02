'use strict';

const calcPerms = require(__dirname+'/../../permission/calcperms.js');

module.exports = (req, res, next) => {
	res.locals.permissions = calcPerms(req, res);
	next();
};
