'use strict';

const { cacheTemplates, meta }= require(__dirname+'/../configs/main.json')
	, { outputFile } = require('fs-extra')
	, pug = require('pug')
	, path = require('path')
	, uploadDirectory = require(__dirname+'/files/uploadDirectory.js')
	, Mutex = require(__dirname+'/../mutex.js')
	, templateDirectory = path.join(__dirname+'/../views/pages/');

module.exports = async (htmlName, templateName, options) => {
	const html = pug.renderFile(`${templateDirectory}${templateName}`, { ...options, cache: cacheTemplates, meta });
	const { id, key } = await Mutex.acquire(htmlName);
	await outputFile(`${uploadDirectory}html/${htmlName}`, html);
	await Mutex.release(key, id);
	return html;
};
