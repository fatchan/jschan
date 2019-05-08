'use strict';

const imageMimeTypes = new Set([
	'image/jpeg',
	'image/pjpeg',
	'image/png',
	'image/bmp',
	'image/gif',
	'image/webp',
]);

const videoMimeTypes = new Set([
	'video/mp4',
	'video/webm',
]);

module.exports = (mimetype, options) => {

	return (options.video && videoMimeTypes.has(mimetype)) || (options.image && imageMimeTypes.has(mimetype));

};
