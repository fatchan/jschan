'use strict';

const { buildCaptcha } = require(__dirname+'/../../build.js')
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js');

module.exports = async (req, res, next) => {

	try {
		await buildCaptcha();
	} catch (err) {
		return next(err);
	}

	return res.sendFile(`${uploadDirectory}html/captcha.html`);

}
