const ffmpeg = require('fluent-ffmpeg')
	, configs = require(__dirname+'/../../configs/main.json')
	, uploadDirectory = require(__dirname+'/../uploadDirectory.js');

module.exports = (filename) => {

	return new Promise((resolve, reject) => {
		ffmpeg(uploadDirectory + filename)
		.on('end', () => {
			return resolve();
		})
		.screenshots({
			timestamps: [0],
			count: 1,
			filename: `thumb-${filename.split('.')[0]}.png`,
			folder: uploadDirectory,
			size: '128x?'
		});
	});

};
