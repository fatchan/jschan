'use strict';

const redis = require(__dirname+'/redis.js');

const loadConfig = (message) => {
	config = message || redis.get('globalsettings');
}

loadConfig();
redis.addCallback('config', loadConfig);

module.exports = () => { return config };
