'use strict';

const i18n = require(__dirname+'/../../locale/locale.js')
	, config = require(__dirname+'/../../misc/config.js');

module.exports = {

	setGlobalLanguage: (req, res, next) => {
		// global settings locale
		const { language } = config.get;
		res.locals.setLocale(res.locals, language);
		next();
	},

	setBoardLanguage: (req, res, next) => {
		// board settings locale
		const language = res.locals.board.settings.language;
		res.locals.setLocale(res.locals, language);
		next();
	},

};
