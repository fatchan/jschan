'use strict';

const { buildBypass } = require(__dirname+'/../../lib/build/tasks.js');

module.exports = async (req, res, next) => {

	let html;
	try {
		html = await buildBypass(res.locals.minimal);
	} catch (err) {
		return next(err);
	}

	return res.send(html);

};
