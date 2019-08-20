'use strict';

const { buildCaptcha } = require(__dirname+'/../../helpers/build.js');

module.exports = async (req, res, next) => {

	let html;
	try {
		html = await buildCaptcha();
	} catch (err) {
		return next(err);
	}

	return res.send(html);

}
