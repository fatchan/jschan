'use strict';

const { buildLogin } = require(__dirname+'/../../build.js')
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js');

module.exports = async (req, res, next) => {

	try {
		await buildLogin();
	} catch (err) {
		return next(err);
	}

	return res.sendFile(`${uploadDirectory}html/login.html`);

}
