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
	'image/apng',
]);

const videoMimeTypes = new Set([
	'video/mpeg',
	'video/quicktime',
	'video/mp4',
	'video/webm',
	'video/x-matroska',
]);

const audioMimeTypes = new Set([
	'audio/mpeg',
	'audio/ogg',
	'audio/wav',
]);

module.exports = (mimetype, options) => {
	return (options.image && imageMimeTypes.has(mimetype)) ||
		(options.animatedImage && animatedImageMimeTypes.has(mimetype)) ||
		(options.video && videoMimeTypes.has(mimetype)) ||
		(options.audio && audioMimeTypes.has(mimetype));
};
