'use strict';

const configs = require(__dirname+'/../configs/main.json')
	, outputFile = require('fs-extra').outputFile
	, pug = require('pug')
	, path = require('path')
	, uploadDirectory = require(__dirname+'/uploadDirectory.js')
	, templateDirectory = path.join(__dirname+'/../views/pages/');

module.exports = async (htmlName, templateName, options) => {
	const html = pug.renderFile(`${templateDirectory}${templateName}`, { ...options, renderStart: Date.now(), cache: configs.cacheTemplates, openGraph: configs.openGraph });
	return outputFile(`${uploadDirectory}html/${htmlName}`, html);
};
