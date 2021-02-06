'use strict';

const FileType = require('file-type')
	, { allowMimeNoMatch } = require(__dirname+'/../../configs/secrets.js');

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
	'video/ogg',
]);

const audio = new Set([
	'audio/flac',
	'audio/mp3',
	'audio/mpeg',
	'audio/ogg',
	'audio/wave',
	'audio/wav',
]);

const other = new Set(require(__dirname+'/../../configs/secrets.js').otherMimeTypes);

module.exports = {

	allowed: (mimetype, options) => {
		return (options.image && image.has(mimetype)) ||
			(options.animatedImage && animatedImage.has(mimetype)) ||
			(options.video && video.has(mimetype)) ||
			(options.audio && audio.has(mimetype)) ||
			(options.other && other.has(mimetype));
	},

	realMimeCheck: async (file) => {
		const supposedMimeType = file.mimetype;
		const realMimeType = await FileType.fromFile(file.tempFilePath);
		if (!realMimeType) {
			return getconfig.allowMimeNoMatch;
		}
		return supposedMimeType === realMimeType.mime;
	},

	image, animatedImage, video, audio, other

};
