'use strict';

const { buildNews } = require(__dirname+'/../../helpers/build.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js');

module.exports = async (req, res, next) => {

	try {
		await buildNews();
	} catch (err) {
		return next(err);
	}

	return res.sendFile(`${uploadDirectory}html/news.html`);

}