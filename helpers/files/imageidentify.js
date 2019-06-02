const gm = require('@tohru/gm')
	, configs = require(__dirname+'/../../configs/main.json')
	, uploadDirectory = require(__dirname+'/../uploadDirectory.js');

module.exports = (filename, folder, temp) => {

	return new Promise((resolve, reject) => {
		gm(temp === true ? filename : `${uploadDirectory}${folder}/${filename}`)
			.identify(function (err, data) {
				if (err) {
					return reject(err);
				}
			return resolve(data)
		});
	});

};
