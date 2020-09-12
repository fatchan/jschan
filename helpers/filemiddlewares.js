'use strict';

const { globalLimits, debugLogs, filterFileNames, spaceFileNameReplacement } = require(__dirname+'/../configs/main.js')
	, dynamicResponse = require(__dirname+'/dynamic.js')
	, uploadLimitFunction = (req, res, next) => {
		return dynamicResponse(req, res, 413, 'message', {
			'title': 'Payload Too Large',
			'message': 'Your upload was too large',
			'redirect': req.headers.referer
		});
	}
	, numFilesUploadLimitFunction = (req, res, next) => {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Too many files',
			'message': 'You sent too many files in one request',
			'redirect': req.headers.referer
		});
	}
	, upload = require('express-fileupload')
	, postFiles = upload({
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


module.exports = {

	handleBannerFiles: upload({
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
		limitHandler: uploadLimitFunction,
		useTempFiles: true,
		tempFileDir: __dirname+'/../tmp/'
	}),

	handlePostFilesEarlyTor:  (req, res, next) => {
		if (res.locals.tor) {
			return postFiles(req, res, next);
		}
		return next();
	},

	handlePostFiles: (req, res, next) => {
		if (res.locals.tor) {
			return next();
		}
		return postFiles(req, res, next);
	},

}
