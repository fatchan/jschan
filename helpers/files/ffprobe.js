const ffmpeg = require('fluent-ffmpeg')
	, configs = require(__dirname+'/../../configs/main.json')
	, uploadDirectory = require(__dirname+'/uploadDirectory.js');

module.exports = (filename, folder, temp) => {

	return new Promise((resolve, reject) => {
		ffmpeg.ffprobe(temp === true ? filename : `${uploadDirectory}/${folder}/${filename}`, (err, metadata) => {
			if (err) {
				return reject(err)
			}
			return resolve(metadata);
		});
	});

};
