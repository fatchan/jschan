'use strict';

const redis = require(__dirname+'/redis.js');

const load = async (message) => {
	module.exports.get = message || (await redis.get('globalsettings'));
};

redis.addCallback('config', load);

module.exports = {
	get: null,
	load,
};
