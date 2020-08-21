'use strict';

const { enableUserBoardCreation, enableUserAccountCreation,
	lockWait, globalLimits, boardDefaults, cacheTemplates,
	meta, enableWebring, captchaOptions } = require(__dirname+'/../configs/main.js')
	, { outputFile } = require('fs-extra')
	, formatSize = require(__dirname+'/files/formatsize.js')
	, pug = require('pug')
	, path = require('path')
	, commit = require(__dirname+'/commit.js')
	, uploadDirectory = require(__dirname+'/files/uploadDirectory.js')
	, redlock = require(__dirname+'/../redlock.js')
	, templateDirectory = path.join(__dirname+'/../views/pages/')
	, renderLocals = {
		cache: cacheTemplates,
		meta,
		commit,
		defaultTheme: boardDefaults.theme,
		defaultCodeTheme: boardDefaults.codeTheme,
		postFilesSize: formatSize(globalLimits.postFilesSize.max),
		enableUserAccountCreation,
		enableUserBoardCreation,
		globalLimits,
		enableWebring,
		captchaType: captchaOptions.type
	}

switch (captchaOptions.type) {
	case 'google':
		renderLocals.googleRecaptchaSiteKey = captchaOptions.google.siteKey;
		break;
	case 'grid':
		renderLocals.captchaGridSize = captchaOptions.gridSize;
		break;
	default:
		break;
}

module.exports = async (htmlName, templateName, options, json=null) => {
	const html = pug.renderFile(`${templateDirectory}${templateName}`, {
		...options,
		...renderLocals,
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
