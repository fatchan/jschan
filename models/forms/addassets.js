'use strict';

const { remove, pathExists } = require('fs-extra')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, uploadDirectory = require(__dirname+'/../../lib/file/uploaddirectory.js')
	, moveUpload = require(__dirname+'/../../lib/file/moveupload.js')
	, mimeTypes = require(__dirname+'/../../lib/file/mimetypes.js')
	, deleteTempFiles = require(__dirname+'/../../lib/file/deletetempfiles.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, { Boards } = require(__dirname+'/../../db/');

module.exports = async (req, res) => {

	const { checkRealMimeTypes } = config.get;
	const redirect = `/${req.params.board}/manage/assets.html`;

	for (let i = 0; i < res.locals.numFiles; i++) {
		if (!mimeTypes.allowed(req.files.file[i].mimetype, {
			image: true,
			animatedImage: true,
			video: false,
			audio: false,
			other: true
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
	}

	const filenames = [];
	for (let i = 0; i < res.locals.numFiles; i++) {
		const file = req.files.file[i];
		file.filename = file.sha256 + file.extension;

		//check if already exists
		const exists = await pathExists(`${uploadDirectory}/asset/${req.params.board}/${file.filename}`);

		if (exists) {
			await remove(file.tempFilePath);
			continue;
		}

		//add to list after checking it doesnt already exist
		filenames.push(file.filename);

		//then upload it
		await moveUpload(file, file.filename, `asset/${req.params.board}`);

		//and delete the temp file
		await remove(file.tempFilePath);

	}

	deleteTempFiles(req).catch(console.error);

	// no new assets
	if (filenames.length === 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'message': `Asset${res.locals.numFiles > 1 ? 's' : ''} already exist${res.locals.numFiles > 1 ? '' : 's'}`,
			'redirect': redirect
		});
	}

	// add assets to the db
	await Boards.addAssets(req.params.board, filenames);

	// add assets to board in memory
	res.locals.board.assets = res.locals.board.assets.concat(filenames);

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': `Uploaded ${filenames.length} new assets.`,
		'redirect': redirect
	});

};
