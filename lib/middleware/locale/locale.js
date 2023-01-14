'use strict';

const i18n = require(__dirname+'/../../locale/locale.js')
	, config = require(__dirname+'/../../misc/config.js');

module.exports = (req, res, next) => {

	// global settings locale
	let { locale } = config.get;

	/* TODO
	// board settings locale
	if (board in res.locals/params) {
		locale = board.settings.locale;
	}
	*/

	//TESTING
	const locale = Math.random() < 0.5 ? 'en' : 'pt';
	console.log('setting locale', locale);
	i18n.setLocale(res.locals, locale);	

	next();

};
