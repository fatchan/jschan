'use strict';

const writePageHTML = require(__dirname+'/../../helpers/writepagehtml.js')
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js');

module.exports = async (req, res, next) => {

	try {
		await writePageHTML('register.html', 'register.pug');
	} catch (err) {
		return next(err);
	}

	return res.sendFile(`${uploadDirectory}html/register.html`);

}
