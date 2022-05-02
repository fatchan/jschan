'use strict';

const { buildRegister } = require(__dirname+'/../../lib/build/tasks.js');

module.exports = async (req, res, next) => {

	let html;
	try {
		html = await buildRegister();
	} catch (err) {
		return next(err);
	}

	return res.send(html);

};
