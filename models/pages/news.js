'use strict';

const { buildNews } = require(__dirname+'/../../lib/build/tasks.js');

module.exports = async (req, res, next) => {

	let html;
	try {
		html = await buildNews();
	} catch (err) {
		return next(err);
	}

	return res.send(html);

}
