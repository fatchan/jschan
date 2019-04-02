'use strict';

const allowedMimeTypes = new Set([
	'image/jpeg',
	'image/pjpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/bmp',
	'video/mp4',
	'video/webm',
]);

module.exports = (mimetype) => allowedMimeTypes.has(mimetype);
