'use strict';

const Queue = require('bull')
	, configs = require(__dirname+'/configs/main.json')
	, generateQueue = new Queue('generate', { 'redis': configs.redis });

module.exports = {

	queue: generateQueue,

	push: (data) => {
		generateQueue.add(data, {
			'removeOnComplete': true,
		});
	}

}
