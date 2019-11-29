const gm = require('gm')
	, configs = require(__dirname+'/../../configs/main.js')
	, uploadDirectory = require(__dirname+'/uploadDirectory.js');

module.exports = (filename, folder, temp) => {

	return new Promise((resolve, reject) => {
		const filePath = temp === true ? filename : `${uploadDirectory}/${folder}/${filename}`;
		gm(`${filePath}[0]`) //0 for first frame of gifs, much faster
			.identify(function (err, data) {
				if (err) {
					return reject(err);
				}
			return resolve(data)
		});
	});

};
