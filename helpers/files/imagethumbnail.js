const gm = require('@tohru/gm')
	, configs = require(__dirname+'/../../configs/main.json')
	, uploadDirectory = require(__dirname+'/../uploadDirectory.js');

module.exports = (filename) => {

	return new Promise((resolve, reject) => {
		gm(`${uploadDirectory}img/${filename}`)
		.resize(128, 128)
		.write(`${uploadDirectory}img/thumb-${filename.split('.')[0]}.jpg`, function (err) {
			if (err) {
				return reject(err);
			}
			return resolve();
		});
	});

};
