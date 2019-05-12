'use strict';

const uuidv4 = require('uuid/v4')
	, path = require('path')
	, remove = require('fs-extra').remove
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
	, imageUpload = require(__dirname+'/../../helpers/files/imageupload.js')
	, fileCheckMimeType = require(__dirname+'/../../helpers/files/file-check-mime-types.js')
	, deleteFailedFiles = require(__dirname+'/../../helpers/files/deletefailed.js')
	, imageIdentify = require(__dirname+'/../../helpers/files/image-identify.js')
	, Boards = require(__dirname+'/../../db/boards.js')

module.exports = async (req, res, next, numFiles) => {

	const redirect = `/${req.params.board}/manage.html`

	// check all mime types befoer we try saving anything
	for (let i = 0; i < numFiles; i++) {
		if (!fileCheckMimeType(req.files.file[i].mimetype, {image: true, video: false})) {
			return res.status(400).render('message', {
				'title': 'Bad request',
				'message': `Invalid file type for ${req.files.file[i].name}. Mimetype ${req.files.file[i].mimetype} not allowed.`,
				'redirect': redirect
			});
		}
	}

	const filenames = [];
	// then upload
	for (let i = 0; i < numFiles; i++) {
		const file = req.files.file[i];
		const uuid = uuidv4();
		const filename = uuid + path.extname(file.name);
		//add filenames to array add processing to delete previous if one fails
		filenames.push(filename);
		// try to save
		try {
			//upload it
			await imageUpload(file, filename, 'banner');
			const imageData = await imageIdentify(filename, 'banner');
			const geometry = imageData.size;
			await remove(file.tempFilePath);
			//make sure its 300x100 banner
			if (geometry.width !== 300 || geometry.height !== 100) {
				await deleteFailedFiles(filenames, 'banner');
				return res.status(400).render('message', {
					'title': 'Bad request',
					'message': `Invalid file ${file.name}. Banners must be 300x100.`,
					'redirect': redirect
				});
			}
		} catch (err) {
			//TODO: this better, catch errors some how
			await remove(file.tempFilePath).catch(e => console.error);
			await deleteFailedFiles(filenames, 'banner').catch(e => console.error);
			return next(err);
		}
	}

	await Boards.addBanners(req.params.board, filenames);

	return res.render('message', {
		'title': 'Success',
		'message': `Uploaded ${filenames.length} banners.`,
		'redirect': redirect
	});

}
