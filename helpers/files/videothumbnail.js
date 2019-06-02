const ffmpeg = require('fluent-ffmpeg')
	, configs = require(__dirname+'/../../configs/main.json')
	, uploadDirectory = require(__dirname+'/../uploadDirectory.js');

module.exports = (filename, geometry) => {

	return new Promise((resolve, reject) => {
		ffmpeg(`${uploadDirectory}img/${filename}`)
		.on('end', () => {
			return resolve();
		})
		.screenshots({
			timestamps: [0],
			count: 1,
			filename: `thumb-${filename.split('.')[0]}.jpg`,
			folder: `${uploadDirectory}img/`,
			size: geometry.width > geometry.height ? '128x?' : '?x128'
			//keep aspect ratio, but also making sure taller/wider thumbs dont exceed 128 in either dimension
		});
	});

};
