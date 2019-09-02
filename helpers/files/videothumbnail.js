const ffmpeg = require('fluent-ffmpeg')
	, configs = require(__dirname+'/../../configs/main.json')
	, uploadDirectory = require(__dirname+'/uploadDirectory.js');

module.exports = (file, geometry) => {

	return new Promise((resolve, reject) => {
		ffmpeg(`${uploadDirectory}img/${file.filename}`)
		.on('end', () => {
			return resolve();
		})
		.screenshots({
			timestamps: ['1%'],//1% should remedy black first frames or fade-ins
			count: 1,
			filename: `thumb-${file.hash}.jpg`,
			folder: `${uploadDirectory}img/`,
			size: geometry.width > geometry.height ? '128x?' : '?x128'
			//keep aspect ratio, but also making sure taller/wider thumbs dont exceed 128 in either dimension
		});
	});

};
