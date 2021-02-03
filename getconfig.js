'use strict';

const { addCallback } = require(__dirname+'/redis.js');

let config = require(__dirname+'/configs/main.js');

const loadConfig = (message) => {
	delete require.cache[__dirname+'/configs/main.js'];
	config = /*message*/ require(__dirname+'/configs/main.js');
}

loadConfig();
addCallback('config', loadConfig);

module.exports = () => { return config };
