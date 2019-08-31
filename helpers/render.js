'use strict';

const { cacheTemplates, meta }= require(__dirname+'/../configs/main.json')
	, { outputFile } = require('fs-extra')
	, pug = require('pug')
	, path = require('path')
	, uploadDirectory = require(__dirname+'/files/uploadDirectory.js')
	, redlock = require(__dirname+'/../redlock.js')
	, templateDirectory = path.join(__dirname+'/../views/pages/');

module.exports = async (htmlName, templateName, options) => {
	const html = pug.renderFile(`${templateDirectory}${templateName}`, { ...options, cache: cacheTemplates, meta });
	const lock = await redlock.lock(`locks:${htmlName}`, 3000); //what is a reasonable ttl?
	await outputFile(`${uploadDirectory}html/${htmlName}`, html);
	await lock.unlock();
	return html;
};
