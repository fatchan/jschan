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
		if (timestamp === 0) {
			//bypass issue with some dumb files like audio album art covert not working with .screenshots
			command
				.inputOptions([
					'-t',
					0
				])
				.outputOptions([
					`-vf scale=${geometry.width > geometry.height ? thumbSize + ':-2' : '-2:' + thumbSize}`,
					'-frames:v 1'
				])
				.output(`${uploadDirectory}/file/thumb/${file.hash}${file.thumbextension}`)
				.run();
		} else {
			command.screenshots({
				timestamps: [timestamp],
				count: 1,
				filename: `${file.hash}${file.thumbextension}`,
				folder: `${uploadDirectory}/file/thumb/`,
				size: geometry.width > geometry.height ? `${thumbSize}x?` : `?x${thumbSize}`
				//keep aspect ratio, but also making sure taller/wider thumbs dont exceed thumbSize in either dimension
			});
		}
	});
};
