'use strict';

const path = require('path')
	, remove = require('fs-extra').remove
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
	, imageUpload = require(__dirname+'/../../helpers/files/imageupload.js')
	, fileCheckMimeType = require(__dirname+'/../../helpers/files/file-check-mime-types.js')
	, imageIdentify = require(__dirname+'/../../helpers/files/image-identify.js')
	, deleteTempFiles = require(__dirname+'/../../helpers/files/deletetempfiles.js')
	, Boards = require(__dirname+'/../../db/boards.js')

module.exports = async (req, res, next, numFiles) => {

	const redirect = `/${req.params.board}/manage.html`

	// check all mime types befoer we try saving anything
	for (let i = 0; i < numFiles; i++) {
		if (!fileCheckMimeType(req.files.file[i].mimetype, {image: true, animatedImage: true, video: false})) {
			await deleteTempFiles(req.files.file)
			return res.status(400).render('message', {
				'title': 'Bad request',
				'message': `Invalid file type for ${req.files.file[i].name}. Mimetype ${req.files.file[i].mimetype} not allowed.`,
				'redirect': redirect
			});
		}
	}

	const filenames = [];
	for (let i = 0; i < numFiles; i++) {
		const file = req.files.file[i];
		const filename = file.sha256 + path.extname(file.name);
		file.filename = filename; //for error to delete failed files
		filenames.push(filename);

//todo: CHECK FILE HASHES before uploading, if exists skip identifying and uploading
		//upload and get metadata
		const imageData = await imageIdentify(req.files.file[i].tempFilePath, null, true);
		const geometry = imageData.size;

		//make sure its 300x100 banner
		if (geometry.width !== 300 || geometry.height !== 100) {
			await deleteTempFiles(req.files.file)
			return res.status(400).render('message', {
				'title': 'Bad request',
				'message': `Invalid file ${file.name}. Banners must be 300x100.`,
				'redirect': redirect
			});
		}
		await imageUpload(file, filename, `banner/${req.params.board}`);
//end todo

		await remove(file.tempFilePath);

	}

	await Boards.addBanners(req.params.board, filenames);
//TODO: banners pages
//	await buildBanners(res.locals.board);

	return res.render('message', {
		'title': 'Success',
		'message': `Uploaded ${filenames.length} banners.`,
		'redirect': redirect
	});

}
