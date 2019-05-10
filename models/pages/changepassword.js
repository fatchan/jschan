'use strict';

const { buildChangePassword } = require(__dirname+'/../../build.js')
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js');

module.exports = async (req, res, next) => {

	try {
		await buildChangePassword();
	} catch (err) {
		return next(err);
	}

	return res.sendFile(`${uploadDirectory}html/changepassword.html`);

}
