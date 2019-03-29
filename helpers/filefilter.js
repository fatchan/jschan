'use strict';

const allowedMimeTypes = new Set(['image/jpeg', 'image/pjpeg', 'image/png', 'image/gif']);

module.exports = (req, file, cb) => {

	if (!allowedMimeTypes.has(file.mimetype)) {
		cb(new Error('file type must be jpg, png or gif'))
	}

	cb(null, true)

}
