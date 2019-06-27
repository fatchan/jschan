'use strict';

const { cacheTemplates, openGraph }= require(__dirname+'/../configs/main.json')
	, { outputFile } = require('fs-extra')
	, pug = require('pug')
	, path = require('path')
	, uploadDirectory = require(__dirname+'/uploadDirectory.js')
	, templateDirectory = path.join(__dirname+'/../views/pages/');

module.exports = async (htmlName, templateName, options) => {
	const html = pug.renderFile(`${templateDirectory}${templateName}`, { ...options, renderStart: Date.now(), cache: cacheTemplates, openGraph: openGraph });
	return outputFile(`${uploadDirectory}html/${htmlName}`, html);
};
