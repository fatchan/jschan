'use strict';

const ffmpeg = require('fluent-ffmpeg')
	, config = require(__dirname+'/../../misc/config.js')
	, uploadDirectory = require(__dirname+'/../uploaddirectory.js');

module.exports = (file, geometry, timestamp) => {
	const { thumbSize } = config.get;
	// workaround: FFmpeg native WebM decoder doesn't handle alpha.
	let inputLib = '';
	if (file.codec == 'vp8') {inputLib = '-c:v libvpx';}
	if (file.codec == 'vp9') {inputLib = '-c:v libvpx-vp9';}
	return new Promise((resolve, reject) => {
		const command = ffmpeg(`${uploadDirectory}/file/${file.filename}`)
			.on('end', () => {
				return resolve();
			})
			.on('error', function(err) {
				return reject(err);
			});
		command
			.inputOptions([
				`-ss ${timestamp}`,
				'-t 0',
				inputLib
			])
			.outputOptions([
				`-vf scale=${geometry.width > geometry.height ? thumbSize + ':-2' : '-2:' + thumbSize}`,
				'-frames:v 1'
			])
			.output(`${uploadDirectory}/file/thumb/${file.hash}${file.thumbextension}`)
			.run();
	});
};
