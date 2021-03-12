'use strict';

const path = require('path')
	, { remove, pathExists } = require('fs-extra')
	, config = require(__dirname+'/../../config.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, moveUpload = require(__dirname+'/../../helpers/files/moveupload.js')
	, mimeTypes = require(__dirname+'/../../helpers/files/mimetypes.js')
	, imageIdentify = require(__dirname+'/../../helpers/files/imageidentify.js')
	, deleteTempFiles = require(__dirname+'/../../helpers/files/deletetempfiles.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, { countryCodesSet } = require(__dirname+'/../../helpers/countries.js')
	, { Boards } = require(__dirname+'/../../db/')
	, buildQueue = require(__dirname+'/../../queue.js');

module.exports = async (req, res, next) => {

	const { globalLimits, checkRealMimeTypes } = config.get;
	const redirect = `/${req.params.board}/manage/assets.html`;

	// check all mime types before we try saving anything
	for (let i = 0; i < res.locals.numFiles; i++) {
		if (!mimeTypes.allowed(req.files.file[i].mimetype, {
				image: true,
				animatedImage: true, //gif flags? i guess lol
				video: false,
				audio: false,
				other: false
			})) {
			await deleteTempFiles(req).catch(e => console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'message': `Invalid file type for ${req.files.file[i].name}. Mimetype ${req.files.file[i].mimetype} not allowed.`,
				'redirect': redirect
			});
		}
	}

	// check for any mismatching supposed mimetypes from the actual file mimetype
	if (checkRealMimeTypes) {
		for (let i = 0; i < res.locals.numFiles; i++) {
			if (!(await mimeTypes.realMimeCheck(req.files.file[i]))) {
				deleteTempFiles(req).catch(e => console.error);
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
		let noExt = path.parse(file.name).name;

		//match case for real country flags
		if (noExt.length === 2 && countryCodesSet.has(noExt.toUpperCase())) {
			file.name = file.name.toUpperCase();
		}

		//check if already exists
		const exists = await res.locals.board.flags
			.some(f => path.parse(f).name.toLowerCase() === noExt.toLowerCase());

		if (exists) {
			await remove(file.tempFilePath);
			continue;
		}

		//add to list after checking it doesnt already exist
		filenames.push(file.name);

		//then upload it
		await moveUpload(file, file.name, `flag/${req.params.board}`);

		//and delete the temp file
		await remove(file.tempFilePath);

	}

	deleteTempFiles(req).catch(e => console.error);

	// no new flags added, so they all must already existed
	if (filenames.length === 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'message': `Flag${res.locals.numFiles > 1 ? 's' : ''} already exist${res.locals.numFiles > 1 ? '' : 's'}`,
			'redirect': redirect
		});
	}

	// add flags in db
	await Boards.addFlags(req.params.board, filenames);

	/*
		should we rebuild here if (overwriting country flag){}?
	*/

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': `Uploaded ${filenames.length} new flags.`,
		'redirect': redirect
	});

}
