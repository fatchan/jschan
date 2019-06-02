'use strict';

const imageMimeTypes = new Set([
	'image/jpeg',
	'image/pjpeg',
	'image/png',
	'image/bmp',
]);

const animatedImageMimeTypes = new Set([
	'image/gif',
	'image/webp',
]);

const videoMimeTypes = new Set([
	'video/quicktime',
	'video/mp4',
	'video/webm',
]);

module.exports = (mimetype, options) => {

	return (options.video && videoMimeTypes.has(mimetype)) || (options.image && imageMimeTypes.has(mimetype) || options.animatedImage && animatedImageMimeTypes.has(mimetype));

};
