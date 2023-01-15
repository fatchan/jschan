'use strict';

const i18n = require(__dirname+'/../../locale/locale.js')
	, config = require(__dirname+'/../../misc/config.js');

module.exports = (req, res, next) => {

	// global settings locale
	let { locale } = config.get;

	// board settings locale
	if (res.locals.board) {
		locale = res.locals.board.settings.locale;
	}

locale='en'
	i18n.setLocale(res.locals, locale);	

	next();

};
