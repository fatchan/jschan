'use strict';

const path = require('path')
	, { remove } = require('fs-extra')
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

	const newFlags = {};
	for (let i = 0; i < res.locals.numFiles; i++) {
		const file = req.files.file[i];
		let noExt = path.parse(file.name).name;
		file.filename = noExt + file.sha256 + file.extension;

		//match case for real country flags
		if (noExt.length === 2 && countryCodesSet.has(noExt.toUpperCase())) {
			noExt = noExt.toUpperCase();
		}

		//add to list after checking it doesnt already exist
		newFlags[noExt] = file.filename;

		//then upload it
		await moveUpload(file, file.filename, `flag/${req.params.board}`);

		//and delete the temp file
		await remove(file.tempFilePath);

	}

	deleteTempFiles(req).catch(e => console.error);

	const updatedFlags = { ...res.locals.board.flags, ...newFlags };

	// add flags in db
	await Boards.setFlags(req.params.board, updatedFlags);

	await remove(`${uploadDirectory}/html/${req.params.board}/thread/`);
	buildQueue.push({
		'task': 'buildBoardMultiple',
		'options': {
			'board': res.locals.board,
			'startpage': 1,
			'endpage': Math.ceil(res.locals.board.settings.threadLimit/10),
		}
	});
	buildQueue.push({
		'task': 'buildCatalog',
		'options': {
			'board': res.locals.board,
		}
	});

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': `Uploaded ${res.locals.numFiles} new flags.`,
		'redirect': redirect
	});

}
