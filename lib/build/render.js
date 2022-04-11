'use strict';

const { outputFile } = require('fs-extra')
	, formatSize = require(__dirname+'/files/formatsize.js')
	, pug = require('pug')
	, path = require('path')
	, commit = require(__dirname+'/commit.js')
	, uploadDirectory = require(__dirname+'/files/uploadDirectory.js')
	, { hcaptcha, google } = require(__dirname+'/../configs/secrets.js')
	, redlock = require(__dirname+'/../redlock.js')
	, { addCallback } = require(__dirname+'/../redis.js')
	, { version } = require(__dirname+'/../package.json')
	, templateDirectory = path.join(__dirname+'/../views/pages/')
	, Permissions = require(__dirname+'/permissions.js')
	, config = require(__dirname+'/../config.js');

let { archiveLinksURL, lockWait, globalLimits, boardDefaults, cacheTemplates, 
		reverseImageLinksURL, meta, enableWebring, captchaOptions, globalAnnouncement } = config.get
	, renderLocals = null;

const updateLocals = () => {
	({ archiveLinksURL, lockWait, globalLimits, boardDefaults, cacheTemplates,
		reverseImageLinksURL, meta, enableWebring, captchaOptions, globalAnnouncement } = config.get);
	renderLocals = {
		Permissions,
		cache: cacheTemplates,
		archiveLinksURL,
		reverseImageLinksURL,
		meta,
		commit,
		version,
		defaultTheme: boardDefaults.theme,
		defaultCodeTheme: boardDefaults.codeTheme,
		postFilesSize: formatSize(globalLimits.postFilesSize.max),
		globalLimits,
		enableWebring,
		captchaType: captchaOptions.type,
		googleRecaptchaSiteKey: google.siteKey,
		hcaptchaSiteKey: hcaptcha.siteKey,
		captchaGridSize: captchaOptions.grid.size,
		globalAnnouncement,
	};
};

updateLocals();
addCallback('config', updateLocals);

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
	return { html, json: json ? json.data : null };
};
