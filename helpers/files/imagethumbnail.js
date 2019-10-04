const gm = require('gm')
	, { thumbSize } = require(__dirname+'/../../configs/main.json')
	, uploadDirectory = require(__dirname+'/uploadDirectory.js');

module.exports = (file) => {

	return new Promise((resolve, reject) => {
		gm(`${uploadDirectory}/img/${file.filename}[0]`) //0 for first gif frame
		.resize(thumbSize, thumbSize)
		.write(`${uploadDirectory}/img/thumb-${file.hash}${file.thumbextension}`, function (err) {
			if (err) {
				return reject(err);
			}
			return resolve();
		});
	});

};
