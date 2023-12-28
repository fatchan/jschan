'use strict';

const ffmpeg = require('fluent-ffmpeg')
	, config = require(__dirname+'/../../misc/config.js')
	, uploadDirectory = require(__dirname+'/../uploaddirectory.js');

module.exports = (file, geometry, timestamp) => {
	const { thumbSize } = config.get;
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
			])
			.outputOptions([
				`-vf scale=${geometry.width > geometry.height ? thumbSize + ':-2' : '-2:' + thumbSize}`,
				'-frames:v 1'
			])
			.output(`${uploadDirectory}/file/thumb/${file.hash}${file.thumbextension}`)
			.run();
	});
};
