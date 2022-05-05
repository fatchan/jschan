'use strict';

module.exports = async(db, redis) => {
	console.log('remove need for configs/webring');
	const webring = require(__dirname+'/../configs/template.js.example');
	const settings = await redis.get('globalsettings');
	const newSettings = { ...settings, ...webring };
	redis.set('globalsettings', newSettings);
};
