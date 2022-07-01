'use strict';

const { debugLogs } = require(__dirname+'/../../configs/secrets.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, Redis = require(__dirname+'/../../lib/redis/redis.js')
	, { Boards } = require(__dirname+'/../../db/')
	, timeUtils = require(__dirname+'/../../lib/converter/timeutils.js')
	, deleteBoard = require(__dirname+'/../../models/forms/deleteboard.js');

module.exports = {

	func: async () => {

		if (config.get.abandonedBoardAction === 0) {
			return;
		}

		const abandonedBoards = await Boards.getAbandoned();
		if (abandonedBoards.length === 0) {
			return;
		}

		if (config.get.abandonedBoardAction <= 2) {
			debugLogs && console.log(`Unlisting${config.get.abandonedBoardAction === 2 ? '+Locking' : ''} ${abandonedBoards.length} abandoned boards.`);
			const abandonedURIs = abandonedBoards.map(b => b._id);
			Boards.unlistMany(abandonedURIs);
		} else { //must be 2
			//run delete board model for each
			debugLogs && console.log(`Deleting ${abandonedBoards.length} abandoned boards.`);
			for (let board of abandonedBoards) {
				try {
					await deleteBoard(board._id, board);
				} catch (err) {
					debugLogs && console.log('Error deleting abandoned board:', err);
				}
			}
		}

	},

	interval: timeUtils.DAY,
	immediate: false,
	condition: 'abandonedBoardAction'

};
