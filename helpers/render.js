'use strict';

const { cacheTemplates, meta }= require(__dirname+'/../configs/main.json')
	, { outputFile } = require('fs-extra')
	, pug = require('pug')
	, path = require('path')
	, uploadDirectory = require(__dirname+'/files/uploadDirectory.js')
	, templateDirectory = path.join(__dirname+'/../views/pages/');

module.exports = async (htmlName, templateName, options) => {
	const html = pug.renderFile(`${templateDirectory}${templateName}`, { ...options, cache: cacheTemplates, meta });
	return outputFile(`${uploadDirectory}html/${htmlName}`, html);
};
