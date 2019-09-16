'use strict';

const { buildHomepage } = require(__dirname+'/../../helpers/tasks.js');

module.exports = async (req, res, next) => {

	let html;
	try {
		html = await buildHomepage();
	} catch (err) {
		return next(err);
	}

	return res.send(html);

}
