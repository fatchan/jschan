'use strict';

const { themes, codeThemes } = require(__dirname+'/../../../helpers/themes.js');

module.exports = async (req, res, next) => {

	res.render('managesettings', {
		csrf: req.csrfToken(),
		themes,
		codeThemes,
	});

}
