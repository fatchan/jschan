'use strict';

const FileType = require('file-type')
	, config = require(__dirname+'/../../config.js')
	, { addCallback } = require(__dirname+'/../../redis.js')
	, image = new Set([
		'image/jpeg',
		'image/pjpeg',
		'image/png',
		'image/bmp',
	])
	, animatedImage = new Set([
		'image/gif',
		'image/webp',
		'image/apng',
	])
	, video = new Set([
		'video/mpeg',
		'video/quicktime',
		'video/mp4',
		'video/webm',
		'video/x-matroska',
		'video/ogg',
	])
	, audio = new Set([
		'audio/flac',
		'audio/mp3',
		'audio/mpeg',
		'audio/ogg',
		'audio/wave',
		'audio/wav',
	]);

let other;

const updateOtherMimes = () => {
	other = new Set(config.get.otherMimeTypes);
};

updateOtherMimes();
addCallback('config', updateOtherMimes);

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
		if (realMimeType) {
			//note the correct file extension in case it is incorrect/missing
			file.extension = `.${realMimeType.ext}`;
			return supposedMimeType === realMimeType.mime;
		}
		return config.get.allowMimeNoMatch;
	},

	image, animatedImage, video, audio, other

};
