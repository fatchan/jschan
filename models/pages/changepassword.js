'use strict';

const { buildChangePassword } = require(__dirname+'/../../lib/build/tasks.js');

module.exports = async (req, res, next) => {

	let html;
	try {
		html = await buildChangePassword();
	} catch (err) {
		return next(err);
	}

	return res.send(html);

}
