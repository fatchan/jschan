'use strict';

const path = require('path')
	, { remove } = require('fs-extra')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, uploadDirectory = require(__dirname+'/../../lib/file/uploaddirectory.js')
	, moveUpload = require(__dirname+'/../../lib/file/moveupload.js')
	, mimeTypes = require(__dirname+'/../../lib/file/mimetypes.js')
	, deleteTempFiles = require(__dirname+'/../../lib/file/deletetempfiles.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, { countryCodesSet } = require(__dirname+'/../../lib/misc/countries.js')
	, { Boards } = require(__dirname+'/../../db/')
	, buildQueue = require(__dirname+'/../../lib/build/queue.js');

module.exports = async (req, res) => {

	const { __ } = res.locals;
	const { checkRealMimeTypes } = config.get;
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
			await deleteTempFiles(req).catch(console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'message': __('Invalid file type for %s. Mimetype %s not allowed.', req.files.file[i].name, req.files.file[i].mimetype),
				'redirect': redirect
			});
		}
	}

	// check for any mismatching supposed mimetypes from the actual file mimetype
	if (checkRealMimeTypes) {
		for (let i = 0; i < res.locals.numFiles; i++) {
			if (!(await mimeTypes.realMimeCheck(req.files.file[i]))) {
				deleteTempFiles(req).catch(console.error);
				return dynamicResponse(req, res, 400, 'message', {
					'title': __('Bad request'),
					'message': __('Mime type mismatch for file "%s"', req.files.file[i].name),
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

	deleteTempFiles(req).catch(console.error);

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
		'title': __('Success'),
		'message': __('Uploaded %s new flags.', res.locals.numFiles),
		'redirect': redirect
	});

};
