'use strict';

const { remove, pathExists } = require('fs-extra')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, uploadDirectory = require(__dirname+'/../../lib/file/uploaddirectory.js')
	, moveUpload = require(__dirname+'/../../lib/file/moveupload.js')
	, mimeTypes = require(__dirname+'/../../lib/file/mimetypes.js')
	, getDimensions = require(__dirname+'/../../lib/file/image/getdimensions.js')
	, deleteTempFiles = require(__dirname+'/../../lib/file/deletetempfiles.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, { Boards } = require(__dirname+'/../../db/')
	, buildQueue = require(__dirname+'/../../lib/build/queue.js');

module.exports = async (req, res) => {

	const { globalLimits, checkRealMimeTypes } = config.get;
	const redirect = `/${req.params.board}/manage/assets.html`;

	for (let i = 0; i < res.locals.numFiles; i++) {
		if (!mimeTypes.allowed(req.files.file[i].mimetype, {
				//banners can be static image or animated (gif, apng, etc)
			image: true,
			animatedImage: true,
			video: false,
			audio: false,
			other: false
		})) {
			await deleteTempFiles(req).catch(console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'message': `Invalid file type for ${req.files.file[i].name}. Mimetype ${req.files.file[i].mimetype} not allowed.`,
				'redirect': redirect
			});
		}

		// check for any mismatching supposed mimetypes from the actual file mimetype
		if (checkRealMimeTypes) {
			if (!(await mimeTypes.realMimeCheck(req.files.file[i]))) {
				deleteTempFiles(req).catch(console.error);
				return dynamicResponse(req, res, 400, 'message', {
					'title': 'Bad request',
					'message': `Mime type mismatch for file "${req.files.file[i].name}"`,
					'redirect': redirect
				});
			}
		}

		//300x100 check
		const imageDimensions = await getDimensions(req.files.file[i].tempFilePath, null, true);
		let geometry = imageDimensions;
		if (Array.isArray(geometry)) {
			geometry = geometry[0];
		}
		if (geometry.width > globalLimits.bannerFiles.width
			|| geometry.height > globalLimits.bannerFiles.height
			|| (globalLimits.bannerFiles.forceAspectRatio === true
				&& (geometry.width/geometry.height !== 3))) {
			await deleteTempFiles(req).catch(console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'message': `Invalid file ${req.files.file[i].name}. Max banner dimensions are ${globalLimits.bannerFiles.width}x${globalLimits.bannerFiles.height}${globalLimits.bannerFiles.forceAspectRatio === true ? ' and must be a 3:1 aspect ratio' : '' }.`,
				'redirect': redirect
			});
		}
	}

	const filenames = [];
	for (let i = 0; i < res.locals.numFiles; i++) {
		const file = req.files.file[i];
		file.filename = file.sha256 + file.extension;

		//check if already exists
		const exists = await pathExists(`${uploadDirectory}/banner/${req.params.board}/${file.filename}`);

		if (exists) {
			await remove(file.tempFilePath);
			continue;
		}

		//add to list after checking it doesnt already exist
		filenames.push(file.filename);

		//then upload it
		await moveUpload(file, file.filename, `banner/${req.params.board}`);

		//and delete the temp file
		await remove(file.tempFilePath);

	}

	deleteTempFiles(req).catch(console.error);

	// no new banners
	if (filenames.length === 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'message': `Banner${res.locals.numFiles > 1 ? 's' : ''} already exist${res.locals.numFiles > 1 ? '' : 's'}`,
			'redirect': redirect
		});
	}

	// add banners to the db
	await Boards.addBanners(req.params.board, filenames);

	// add banners to board in memory
	res.locals.board.banners = res.locals.board.banners.concat(filenames);

	if (filenames.length > 0) {
		//add public banners page to build queue
		buildQueue.push({
			'task': 'buildBanners',
			'options': {
				'board': res.locals.board,
			}
		});
	}

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': `Uploaded ${filenames.length} new banners.`,
		'redirect': redirect
	});

};
