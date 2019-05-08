'use strict';

const outputFile = require('fs-extra').outputFile
	, pug = require('pug')
	, path = require('path')
	, uploadDirectory = require(__dirname+'/uploadDirectory.js')
	, pugDirectory = path.join(__dirname+'/../views/pages/');

module.exports = async (htmlName, pugName, pugVars) => {
	const html = pug.renderFile(`${pugDirectory}${pugName}`, pugVars);
	return outputFile(`${uploadDirectory}html/${htmlName}`, html);
};
