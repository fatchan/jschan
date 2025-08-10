'use strict';

const FileType = require('file-type')
	, config = require(__dirname+'/../misc/config.js')
	, { addCallback } = require(__dirname+'/../redis/redis.js')
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
	])
	, audio = new Set([
		'audio/flac',
		'audio/x-flac',
		'audio/mp3',
		'audio/mpeg',
		'audio/ogg',
		'audio/wave',
		'audio/wav',
		'audio/vnd.wave'
	])
	, realMimeEquivalents = {
		'audio/wave': 'audio/vnd.wave',
		'audio/wav': 'audio/vnd.wave',
		'audio/flac': 'audio/x-flac'
	}
	, oggTypes = new Set([
		'application/ogg',
		'audio/ogg',
		'video/ogg'
	]);

let other;

const updateOtherMimes = () => {
	other = new Set(config.get.otherMimeTypes);
};

updateOtherMimes();
addCallback('config', updateOtherMimes);

async function allowed(file, options) {
	const mimetype = file.mimetype;
	//some browsers send a generic 'application/ogg' MIME type for any .ogg file,
	//so let's always do a real MIME check to avoid rejecting valid files
	if (mimetype === 'application/ogg') {
		return oggMimeCheck(file, options);
	}
	return (options.image && image.has(mimetype)) ||
		(options.animatedImage && animatedImage.has(mimetype)) ||
		(options.video && video.has(mimetype)) ||
		(options.audio && audio.has(mimetype)) ||
		(options.other && other.has(mimetype));
}

async function oggMimeCheck(file, options) {
	const realMimeType = await FileType.fromFile(file.tempFilePath);
	if (realMimeType) {
		//replace browser-provided MIME with a more accurate one
		file.mimetype = realMimeType.mime;

		file.extension = `.${realMimeType.ext}`;
		file.realMimetype = realMimeType.mime;

		return oggTypes.has(file.realMimetype) && await allowed(file, options);
	}
	return config.get.allowMimeNoMatch;
}

async function realMimeCheck(file) {
	const supposedMimeType = file.mimetype;
	//skip MIME retrieval if we already did it before via oggMimeCheck
	if (supposedMimeType === file.realMimetype) {
		return true;
	}
	const realMimeType = await FileType.fromFile(file.tempFilePath);
	if (realMimeType) {
		//note the correct file extension in case it is incorrect/missing
		file.extension = `.${realMimeType.ext}`;
		file.realMimetype = realMimeType.mime;

		//account for false mismatch between supposed type and file-type's real type
		const equivalent = realMimeEquivalents[supposedMimeType];

		return (supposedMimeType === realMimeType.mime) ||
			(equivalent === realMimeType.mime);
	}
	return config.get.allowMimeNoMatch;
}

module.exports = {

	allowed,

	realMimeCheck,

	getOther: () => other,

	image, animatedImage, video, audio

};
