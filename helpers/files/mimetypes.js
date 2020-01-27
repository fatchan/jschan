'use strict';

const image = new Set([
	'image/jpeg',
	'image/pjpeg',
	'image/png',
	'image/bmp',
]);

const animatedImage = new Set([
	'image/gif',
	'image/webp',
	'image/apng',
]);

const video = new Set([
	'video/mpeg',
	'video/quicktime',
	'video/mp4',
	'video/webm',
	'video/x-matroska',
]);

const audio = new Set([
	'audio/mp3',
	'audio/mpeg',
	'audio/ogg',
	'audio/wave',
	'audio/wav',
]);

const other = new Set(require(__dirname+'/../../configs/main.js').otherMimeTypes);

module.exports = {

	allowed: (mimetype, options) => {
		return (options.image && image.has(mimetype)) ||
			(options.animatedImage && animatedImage.has(mimetype)) ||
			(options.video && video.has(mimetype)) ||
			(options.audio && audio.has(mimetype)) ||
			(options.other && other.has(mimetype));
	},

	image, animatedImage, video, audio, other

};
