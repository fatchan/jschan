const gm = require('gm')
	, { thumbSize } = require(__dirname+'/../../configs/main.js')
	, uploadDirectory = require(__dirname+'/uploadDirectory.js');

module.exports = (file, firstFrameOnly=true) => {

	return new Promise((resolve, reject) => {
		//[0] for first frame (gifs, etc)
		gm(`${uploadDirectory}/file/${file.filename}${firstFrameOnly ? '[0]' : ''}`)
		.resize(Math.min(thumbSize, file.geometry.width), Math.min(thumbSize, file.geometry.height))
		.write(`${uploadDirectory}/file/thumb-${file.hash}${file.thumbextension}`, function (err) {
			if (err) {
				return reject(err);
			}
			return resolve();
		});
	});

};
