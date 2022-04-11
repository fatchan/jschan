'use strict';

const { buildCreate } = require(__dirname+'/../../lib/build/tasks.js');

module.exports = async (req, res, next) => {

	return res.render('create');

/*
	let html;
	try {
		html = await buildCreate();
	} catch (err) {
		return next(err);
	}

	return res.send(html);
*/

}
