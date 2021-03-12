'use strict';

const fs = require('fs-extra');

module.exports = async(db, redis) => {
	console.log('adding flags customisation db entries');
	const template = require(__dirname+'/../configs/template.js.example');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'globalLimits.flagFiles': template.globalLimits.flagFiles,
		}
	});
	await db.collection('boards').updateMany({}, {
		'$set': {
			'flags': [],
		}
	});
};
