'use strict';

const util = require('util')
	, fs = require('fs')
	, pug = require('pug')
	, path = require('path')
	, writeFile = util.promisify(fs.writeFile)
	, uploadDirectory = require(__dirname+'/uploadDirectory.js')
	, pugDirectory = path.join(__dirname+'/../views/pages');

module.exports = async (htmlName, pugName, pugVars) => {
	const html = pug.renderFile(`${pugDirectory}/${pugName}`, pugVars);
	return writeFile(`${uploadDirectory}html/${htmlName}`, html);
};
