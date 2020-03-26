const ffmpeg = require('fluent-ffmpeg')
	, { thumbSize } = require(__dirname+'/../../configs/main.js')
	, uploadDirectory = require(__dirname+'/uploadDirectory.js');

module.exports = (file, geometry) => {

	return new Promise((resolve, reject) => {
		ffmpeg(`${uploadDirectory}/file/${file.filename}`)
		.on('end', () => {
			return resolve();
		})
		.screenshots({
			timestamps: ['1%'],//1% should remedy black first frames or fade-ins
			count: 1,
			filename: `thumb-${file.hash}${file.thumbextension}`,
			folder: `${uploadDirectory}/file/`,
			size: geometry.width > geometry.height ? `${thumbSize}x?` : `?x${thumbSize}`
			//keep aspect ratio, but also making sure taller/wider thumbs dont exceed thumbSize in either dimension
		});
	});

};
