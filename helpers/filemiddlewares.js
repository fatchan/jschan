'use strict';

const { debugLogs } = require(__dirname+'/../configs/secrets.js')
	, dynamicResponse = require(__dirname+'/dynamic.js')
	, { addCallback } = require(__dirname+'/../redis.js')
	, upload = require('express-fileupload');

let postFiles,
	uploadLimitFunction,
	handleBannerFiles,
	handleFlagFiles,
	numFilesUploadLimitFunction,
	numFlagsUploadLimitFunction,
	numBannersUploadLimitFunction;

const updateHandlers = () => {
	//this thing is kinda gross
	const { globalLimits,  filterFileNames, spaceFileNameReplacement } = require(__dirname+'/../config.js').get
	uploadLimitFunction = (req, res, next) => {
		return dynamicResponse(req, res, 413, 'message', {
			'title': 'Payload Too Large',
			'message': 'Your upload was too large',
			'redirect': req.headers.referer
		});
	};
	numFilesUploadLimitFunction = (req, res, next) => {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Too many files',
			'message': res.locals.board ? `Max files per post ${res.locals.board.settings.maxFiles < globalLimits.postFiles.max ? 'on this board ' : ''}is ${res.locals.board.settings.maxFiles}`
				: `Max files per request is ${globalLimits.postFiles.max}`, //because of difference in TOR body parsing, we dont populate res.locals.board at this point. something to address later.
			'redirect': req.headers.referer
		});
	};
	numBannersUploadLimitFunction = (req, res, next) => {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Too many files',
			'message': `Max banners per request is ${globalLimits.bannerFiles.max}`,
			'redirect': req.headers.referer
		});
	};
	numFlagsUploadLimitFunction = (req, res, next) => {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Too many files',
			'message': `Max banners per request is ${globalLimits.flagFiles.max}`,
			'redirect': req.headers.referer
		});
	};
	handleBannerFiles = upload({
		debug: debugLogs,
		createParentPath: true,
		safeFileNames: filterFileNames,
		spaceFileNameReplacement,
		preserveExtension: 4,
		limits: {
			totalSize: globalLimits.bannerFilesSize.max,
			fileSize: globalLimits.bannerFilesSize.max,
			files: globalLimits.bannerFiles.max
		},
		numFilesLimitHandler: numBannersUploadLimitFunction,
		limitHandler: uploadLimitFunction,
		useTempFiles: true,
		tempFileDir: __dirname+'/../tmp/'
	});
	module.exports.handleBannerFiles = handleBannerFiles;
	handleFlagFiles = upload({
		debug: debugLogs,
		createParentPath: true,
		safeFileNames: filterFileNames,
		spaceFileNameReplacement,
		preserveExtension: 4,
		limits: {
			totalSize: globalLimits.flagFilesSize.max,
			fileSize: globalLimits.flagFilesSize.max,
			files: globalLimits.flagFiles.max
		},
		numFilesLimitHandler: numFlagsUploadLimitFunction,
		limitHandler: uploadLimitFunction,
		useTempFiles: true,
		tempFileDir: __dirname+'/../tmp/'
	});
	module.exports.handleFlagFiles = handleFlagFiles;
	postFiles = upload({
		debug: debugLogs,
		createParentPath: true,
		safeFileNames: filterFileNames,
		spaceFileNameReplacement,
		preserveExtension: 4,
		limits: {
			totalSize: globalLimits.postFilesSize.max,
			fileSize: globalLimits.postFilesSize.max,
			files: globalLimits.postFiles.max
		},
		numFilesLimitHandler: numFilesUploadLimitFunction,
		limitHandler: uploadLimitFunction,
		useTempFiles: true,
		tempFileDir: __dirname+'/../tmp/'
	});
};

updateHandlers();
addCallback('config', updateHandlers);

module.exports = {

	handleBannerFiles,
	handleFlagFiles,

	handlePostFilesEarlyTor: (req, res, next) => {
		if (res.locals.anonymizer) {
			return postFiles(req, res, next);
		}
		return next();
	},

	handlePostFiles: (req, res, next) => {
		if (res.locals.anonymizer) {
			return next();
		}
		return postFiles(req, res, next);
	},

}
