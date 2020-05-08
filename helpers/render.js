'use strict';

const { enableAccountCreation, enableUserBoards, lockWait, globalLimits, boardDefaults, cacheTemplates, meta } = require(__dirname+'/../configs/main.js')
	, { outputFile } = require('fs-extra')
	, formatSize = require(__dirname+'/files/formatsize.js')
	, pug = require('pug')
	, path = require('path')
	, commit = require(__dirname+'/commit.js')
	, uploadDirectory = require(__dirname+'/files/uploadDirectory.js')
	, redlock = require(__dirname+'/../redlock.js')
	, templateDirectory = path.join(__dirname+'/../views/pages/')

module.exports = async (htmlName, templateName, options, json=null) => {
	const html = pug.renderFile(`${templateDirectory}${templateName}`, {
		...options,
		cache: cacheTemplates,
		meta,
		commit,
		defaultTheme: boardDefaults.theme,
		defaultCodeTheme: boardDefaults.codeTheme,
		postFilesSize: formatSize(globalLimits.postFilesSize.max),
		enableAccountCreation,
		enableUserBoards,
		globalLimits,
	});
	const lock = await redlock.lock(`locks:${htmlName}`, lockWait);
	const htmlPromise = outputFile(`${uploadDirectory}/html/${htmlName}`, html);
	let jsonPromise;
	if (json !== null) {
		jsonPromise = outputFile(`${uploadDirectory}/json/${json.name}`, JSON.stringify(json.data));
	}
	await Promise.all([htmlPromise, jsonPromise]);
	await lock.unlock();
	return html;
};
