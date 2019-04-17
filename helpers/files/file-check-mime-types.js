'use strict';

const imageMimeTypes = new Set([
	'image/jpeg',
	'image/pjpeg',
	'image/png',
	'image/gif',
]);

const videoMimeTypes = new Set([
	'image/webp',
	'image/bmp',
	'video/mp4',
	'video/webm',
]);

module.exports = (mimetype, options) => {

	return (options.video && videoMimeTypes.has(mimetype)) || (options.image && imageMimeTypes.has(mimetype));

};
