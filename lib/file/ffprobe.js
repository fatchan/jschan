'use strict';

const ffmpeg = require('fluent-ffmpeg')
	, uploadDirectory = require(__dirname+'/uploaddirectory.js');

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
