'use strict';

const { buildBypass } = require(__dirname+'/../../helpers/tasks.js');

module.exports = async (req, res, next) => {

	let html;
	try {
		html = await buildBypass();
	} catch (err) {
		return next(err);
	}

	return res.send(html);

}
