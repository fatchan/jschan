'use strict';

const fs = require('fs-extra');

module.exports = async(db, redis) => {
	console.log('add markdown permissions');
	const template = require(__dirname+'/../configs/template.js.example');
	const settings = await redis.get('globalsettings');
	const newSettings = { ...settings, permLevels: template.permLevels };
	redis.set('globalsettings', newSettings);
};
