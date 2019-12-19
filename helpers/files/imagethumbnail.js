const gm = require('gm')
	, { thumbSize } = require(__dirname+'/../../configs/main.js')
	, uploadDirectory = require(__dirname+'/uploadDirectory.js');

module.exports = (file) => {

	return new Promise((resolve, reject) => {
		gm(`${uploadDirectory}/img/${file.filename}[0]`) //0 for first gif frame
		.resize(Math.min(thumbSize, file.geometry.width), Math.min(thumbSize, file.geometry.height))
		.write(`${uploadDirectory}/img/thumb-${file.hash}${file.thumbextension}`, function (err) {
			if (err) {
				return reject(err);
			}
			return resolve();
		});
	});

};
