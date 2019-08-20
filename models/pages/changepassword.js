'use strict';

const { buildChangePassword } = require(__dirname+'/../../helpers/build.js');

module.exports = async (req, res, next) => {

	let html;
	try {
		html = await buildChangePassword();
	} catch (err) {
		return next(err);
	}

	return res.send(html);

}
