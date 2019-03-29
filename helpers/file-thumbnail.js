const gm = require('@tohru/gm')
	, configs = require(__dirname+'/../configs/main.json')
	, uploadDirectory = require(__dirname+'/uploadDirectory.js');

module.exports = (filename) => {

	return new Promise((resolve, reject) => {
		gm(uploadDirectory + filename)
			.resize(128, 128)
			.noProfile()
			.write(uploadDirectory + 'thumb-' + filename, function (err) {
				if (err) {
					return reject(err);
				}
			});
		return resolve();
	});

};
