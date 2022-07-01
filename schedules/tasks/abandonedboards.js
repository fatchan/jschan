'use strict';

const fetch = require('node-fetch')
	, { debugLogs } = require(__dirname+'/../../configs/secrets.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, Redis = require(__dirname+'/../../lib/redis/redis.js')
	, { Boards, Accounts } = require(__dirname+'/../../db/')
	, timeUtils = require(__dirname+'/../../lib/converter/timeutils.js');

module.exports = {

	func: async () => {

		if (config.get.abandonedBoardAction === 0) {
			return;
		}

		//TODO: handle abandoned boards. 1=unlist, 2=unlist+lock, 3=delete

	},

	interval: timeUtils.DAY,
	immediate: false,
	condition: 'abandonedBoardAction'

};
