const gm = require('gm')
	, configs = require(__dirname+'/../../configs/main.json')
	, uploadDirectory = require(__dirname+'/uploadDirectory.js');

module.exports = (file) => {

	return new Promise((resolve, reject) => {
		gm(`${uploadDirectory}/img/${file.filename}[0]`) //0 for first gif frame
		.resize(128, 128)
		.write(`${uploadDirectory}/img/thumb-${file.hash}${configs.thumbExtension}`, function (err) {
			if (err) {
				return reject(err);
			}
			return resolve();
		});
	});

};
