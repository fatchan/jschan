'use strict';

const { themes, codeThemes } = require(__dirname+'/../../../helpers/themes.js');

module.exports = async (req, res, next) => {

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('managesettings', {
		csrf: req.csrfToken(),
		themes,
		codeThemes,
	});

}
