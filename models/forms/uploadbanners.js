'use strict';

const path = require('path')
	, { remove, pathExists } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, moveUpload = require(__dirname+'/../../helpers/files/moveupload.js')
	, fileCheckMimeType = require(__dirname+'/../../helpers/files/mimetypes.js')
	, imageIdentify = require(__dirname+'/../../helpers/files/imageidentify.js')
	, deleteTempFiles = require(__dirname+'/../../helpers/files/deletetempfiles.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, { Boards } = require(__dirname+'/../../db/')
	, buildQueue = require(__dirname+'/../../queue.js');

module.exports = async (req, res, next) => {

	const redirect = `/${req.params.board}/manage/banners.html`

	// check all mime types before we try saving anything
	for (let i = 0; i < res.locals.numFiles; i++) {
		if (!fileCheckMimeType(req.files.file[i].mimetype, {image: true, animatedImage: true, video: false, audio: false})) {
			await deleteTempFiles(req).catch(e => console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'message': `Invalid file type for ${req.files.file[i].name}. Mimetype ${req.files.file[i].mimetype} not allowed.`,
				'redirect': redirect
			});
		}
	}

	const filenames = [];
	for (let i = 0; i < res.locals.numFiles; i++) {
		const file = req.files.file[i];
		const filename = file.sha256 + path.extname(file.name);
		file.filename = filename;

		//check if already exists
		const exists = await pathExists(`${uploadDirectory}/banner/${req.params.board}/${filename}`);

		if (exists) {
			await remove(file.tempFilePath);
			continue;
		}

		//add to list after checking it doesnt already exist
		filenames.push(filename);

		//get metadata from tempfile
		const imageData = await imageIdentify(req.files.file[i].tempFilePath, null, true);
		let geometry = imageData.size;
		if (Array.isArray(geometry)) {
			geometry = geometry[0];
		}

		//make sure its 300x100 banner
		if (geometry.width !== 300 || geometry.height !== 100) {
			await deleteTempFiles(req).catch(e => console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'message': `Invalid file ${file.name}. Banners must be 300x100.`,
				'redirect': redirect
			});
		}

		//then upload it
		await moveUpload(file, filename, `banner/${req.params.board}`);

		//and delete the temp file
		await remove(file.tempFilePath);

	}

	deleteTempFiles(req).catch(e => console.error);

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

}
