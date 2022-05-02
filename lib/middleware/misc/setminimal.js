'use strict';

module.exports = (req, res, next) => {
	res.locals.minimal = true;
	next();
};
