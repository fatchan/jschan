'use strict';

const outputFile = require('fs-extra').outputFile
	, pug = require('pug')
	, path = require('path')
	, uploadDirectory = require(__dirname+'/uploadDirectory.js')
	, templateDirectory = path.join(__dirname+'/../views/pages/');

module.exports = async (htmlName, templateName, options) => {
	const html = pug.renderFile(`${templateDirectory}${templateName}`, options);
	return outputFile(`${uploadDirectory}html/${htmlName}`, html);
};
