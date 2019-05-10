'use strict';

const { buildHomepage } = require(__dirname+'/../../build.js')
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js');

module.exports = async (req, res, next) => {

	try {
		await buildHomepage();
	} catch (err) {
		return next(err);
	}

	return res.sendFile(`${uploadDirectory}html/index.html`);

}
