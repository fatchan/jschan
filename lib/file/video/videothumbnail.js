'use strict';

const ffmpeg = require('fluent-ffmpeg')
	, config = require(__dirname+'/../../misc/config.js')
	, uploadDirectory = require(__dirname+'/../uploaddirectory.js');

module.exports = (file, geometry, timestamp) => {

	const { thumbSize } = config.get;

	let inputArgs = [
		timestamp === 0 ? '-t 0' : `-ss ${timestamp}`
	];
	let outputArgs = [
		`-vf scale=${geometry.width > geometry.height ? thumbSize + ':-2' : '-2:' + thumbSize}`,
		'-frames:v 1'
	];

	// workaround: FFmpeg native WebM decoder doesn't handle alpha.
	if (file.codec === 'vp8') { inputArgs.push('-c:v libvpx'); }
	if (file.codec === 'vp9') { inputArgs.push('-c:v libvpx-vp9'); }

	return new Promise((resolve, reject) => {
		const command = ffmpeg(`${uploadDirectory}/file/${file.filename}`)
			.on('end', () => {
				return resolve();
			})
			.on('error', function(err) {
				return reject(err);
			});
		command
			.inputOptions(inputArgs)
			.outputOptions(outputArgs)
			.output(`${uploadDirectory}/file/thumb/${file.hash}${file.thumbextension}`)
			.run();
	});
};
