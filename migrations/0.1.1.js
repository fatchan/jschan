'use strict';

const fs = require('fs-extra');

module.exports = async(db, redis) => {
	console.log('adding flags customisation');
	await fs.ensureDir(`${uploadDirectory}/flag/`);
	const template = require(__dirname+'/../configs/template.js.example');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'globalLimits.flagFiles': template.globalLimits.flagFiles,
			'globalLimits.flagFilesSize': template.globalLimits.flagFilesSize,
		}
	});
	await db.collection('boards').updateMany({}, {
		'$set': {
			'flags': [],
		}
	});
};
