'use strict';

const util = require('util')
	, fs = require('fs')
	, unlink = util.promisify(fs.unlink)
	, stat = util.promisify(fs.stat)
	, readdir = util.promisify(fs.readdir)
	, uploadDirectory = require(__dirname+'/helpers/uploadDirectory.js');

async function deleteCaptchas() {

	try {
		const files = await readdir(`${uploadDirectory}captcha/`);
		if (files.length > 0) {
			files.forEach(async (file) => {
				const filePath = `${uploadDirectory}captcha/${file}`;
				const stats = await stat(filePath).catch(e => console.error);
				if (!stats) {
					return;
				}
				const now = Date.now();
				const expiry = new Date(stats.ctime).getTime() + 6*1000*60; //6 minutes ahead
				if (now > expiry) {
					await unlink(filePath).catch(e => console.error);
				}
			});
		}
	} catch (err) {
		console.error(err);
	}

}

deleteCaptchas();
setInterval(deleteCaptchas, 6*1000*60);
