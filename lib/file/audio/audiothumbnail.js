const ffmpeg = require('fluent-ffmpeg')
	, config = require(__dirname+'/../../config.js')
	, uploadDirectory = require(__dirname+'/uploadDirectory.js');

module.exports = (file) => {

	const { thumbSize } = config.get;
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
