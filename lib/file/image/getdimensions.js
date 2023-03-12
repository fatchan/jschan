const gm = require('@fatchan/gm')
	, uploadDirectory = require(__dirname+'/../uploaddirectory.js');

module.exports = (filename, folder, temp) => {

	return new Promise((resolve, reject) => {
		const filePath = temp === true ? filename : `${uploadDirectory}/${folder}/${filename}`;
		gm(`${filePath}[0]`) //0 for first frame of gifs, much faster
			.size(function (err, data) {
				if (err) {
					return reject(err);
				}
				return resolve(data);
			});
	});

};
