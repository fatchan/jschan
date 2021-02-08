'use strict';

module.exports = async(db, redis) => {
	console.log('migrate old config to db');
	const oldSettings = require(__dirname+'/../configs/main.js');
	const secrets = require(__dirname+'/../configs/secrets.js');
	//delete anythign thats in the secrets
	Object.keys(secrets).forEach(key => {
		delete oldSettings[key];
	});
	//and a few more that arent in the root
	delete oldSettings.captchaOptions.google;
	delete oldSettings.captchaOptions.hcaptcha;
	//set default settings into redis instead
	redis.set('globalsettings', oldSettings);
};
