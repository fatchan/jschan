'use strict';

const redis = require(__dirname+'/../redis/redis.js')
	, Mongo = require(__dirname+'/../../db/db.js');

const load = async (message) => {
	module.exports.get = message || (await Mongo.getConfig());
};

redis.addCallback('config', load);

module.exports = {
	get: null,
	load,
};
