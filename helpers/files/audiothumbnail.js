const ffmpeg = require('fluent-ffmpeg')
	, { thumbSize } = require(__dirname+'/../../configs/main.js')
	, uploadDirectory = require(__dirname+'/uploadDirectory.js');

module.exports = (file) => {

	return new Promise((resolve, reject) => {
		ffmpeg(`${uploadDirectory}/file/${file.filename}`)
		.on('end', () => {
			return resolve();
		})
		.on('error', function(err, stdout, stderr) {
			return reject(err);
		})
		.complexFilter([{
			filter: 'showwavespic',
			options: { split_channels: 1, s: `${thumbSize}x${thumbSize}` }
		}])
		.save(`${uploadDirectory}/file/thumb/${file.hash}${file.thumbextension}`);
	});

};
