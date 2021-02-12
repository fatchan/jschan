'use strict';

const fs = require('fs-extra');

module.exports = async(db, redis) => {
	console.log('remove need for configs/webring');
	const webring = require(__dirname+'/../configs/template.js.example');
	const settings = await redis.get('globalsetings');
	const newSettings = { ...settings, ...webring };
	redis.set('globalsettings', newSettings);
};
