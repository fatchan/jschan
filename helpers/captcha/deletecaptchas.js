'use strict';

const { stat, remove, readdir } = require('fs-extra')
    , uploadDirectory = require(__dirname+'/../files/uploadDirectory.js')
    , msTime = require(__dirname+'/../mstime.js')

module.exports = async () => {
	const files = await readdir(`${uploadDirectory}captcha/`);
	if (files.length > 0) {
		files.forEach(async (file) => {
			try {
				const filePath = `${uploadDirectory}captcha/${file}`;
				const stats = await stat(filePath);
				const now = Date.now();
				const expiry = new Date(stats.ctime).getTime() + msTime.minute*5;
				if (now > expiry) {
					await remove(filePath);
					console.log(`Deleted expired captcha ${filePath}`)
				}
			} catch (e) {
				console.error(e);
			}
		});
	}
}
