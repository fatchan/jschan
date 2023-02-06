'use strict';

const i18n = require('i18n')
	, path = require('path')
	, { debugLogs } = require(__dirname+'/../../configs/secrets.js');

i18n.configure({
	directory: path.join(__dirname, '/../../locales'),
	defaultLocale: 'en-GB',
	retryInDefaultLocale: false,
	updateFiles: false, //holy FUCK why is that an option
	cookie: null,
	header: null,
	queryParameter: null,
});

debugLogs && console.log('Locales loaded:', i18n.getLocales());

module.exports = i18n;
