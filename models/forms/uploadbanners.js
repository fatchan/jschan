'use strict';

const path = require('path')
	, { remove, pathExists, ensureDir } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
	, imageUpload = require(__dirname+'/../../helpers/files/imageupload.js')
	, fileCheckMimeType = require(__dirname+'/../../helpers/files/mimetypes.js')
	, imageIdentify = require(__dirname+'/../../helpers/files/imageidentify.js')
	, deleteTempFiles = require(__dirname+'/../../helpers/files/deletetempfiles.js')
	, Boards = require(__dirname+'/../../db/boards.js')
	, { buildBanners } = require(__dirname+'/../../build.js')

module.exports = async (req, res, next) => {

	const redirect = `/${req.params.board}/manage.html`

	// check all mime types before we try saving anything
	for (let i = 0; i < res.locals.numFiles; i++) {
		if (!fileCheckMimeType(req.files.file[i].mimetype, {image: true, animatedImage: true, video: false})) {
			await deleteTempFiles(req).catch(e => console.error);
			return res.status(400).render('message', {
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
		const exists = await pathExists(`${uploadDirectory}banner/${req.params.board}/${filename}`);

		if (exists) {
			await remove(file.tempFilePath);
			continue;
		}

		//add to list after checking it doesnt already exist
		filenames.push(filename);

		//make directory if doesnt exist
		await ensureDir(`${uploadDirectory}banner/${req.params.board}/`);

		//get metadata from tempfile
		const imageData = await imageIdentify(req.files.file[i].tempFilePath, null, true);
		let geometry = imageData.size;
		if (Array.isArray(geometry)) {
			geometry = geometry[0];
		}

		//make sure its 300x100 banner
		if (geometry.width !== 300 || geometry.height !== 100) {
			await deleteTempFiles(req).catch(e => console.error);
			return res.status(400).render('message', {
				'title': 'Bad request',
				'message': `Invalid file ${file.name}. Banners must be 300x100.`,
				'redirect': redirect
			});
		}

		//then upload it
		await imageUpload(file, filename, `banner/${req.params.board}`);

		//and delete the temp file
		await remove(file.tempFilePath);

	}

	deleteTempFiles(req).catch(e => console.error);

	// add banners to the db
	await Boards.addBanners(req.params.board, filenames);

	//add banners to board in memory
	res.locals.board.banners = res.locals.board.banners.concat(filenames);

	// rebuild the public banners page
	await buildBanners(res.locals.board);

	return res.render('message', {
		'title': 'Success',
		'message': `Uploaded ${filenames.length} new banners.`,
		'redirect': redirect
	});

}
