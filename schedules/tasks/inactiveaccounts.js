'use strict';

const { debugLogs } = require(__dirname+'/../../configs/secrets.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, Redis = require(__dirname+'/../../lib/redis/redis.js')
	, { Boards, Accounts } = require(__dirname+'/../../db/')
	, timeUtils = require(__dirname+'/../../lib/converter/timeutils.js');

module.exports = {

	func: async () => {

		if (config.get.inactiveAccountAction === 0) {
			return;
		}

		const inactiveAccounts = await Accounts.getInactive(config.get.inactiveAccountTime);
		if (inactiveAccounts.length === 0) {
			return;
		}

		const cacheDeleteSet = new Set()
			, boardBulkWrites = []
			, inactiveWithBoards = inactiveAccounts.filter(acc => {
				//only deal with boards if they have any (acc deletes still processed later)
				return acc.ownedBoards.length > 0 || acc.staffBoards.length > 0;
			});

		let boardsPromise = null
			, accountsPromise = null;

		//create promise for boards (remove staff.${username})
		inactiveWithBoards.forEach(acc => {
			//remove account from staff and owner of all their boards
			const accountBoards = [...acc.ownedBoards, ...acc.staffBoards];
			accountBoards.forEach(b => cacheDeleteSet.add(b));
			boardBulkWrites.push({
				updateOne: {
					filter: {
						'_id': {
							'$in': accountBoards,
							//better to do per board for staff unsets? or per-account...
						}
					},
					update: {
						$unset: {
							[`staff.${acc._id}`]: '',
						},
					}
				}
			});
			acc.ownedBoards.forEach(ob => {
				boardBulkWrites.push({
					updateOne: {
						filter: {
							'_id': ob,
						},
						update: {
							'$set': {
								'owner': null,
							},
						}
					}
				});
			});
		});
		if (boardBulkWrites.length > 0) {
			boardsPromise = Boards.db.bulkWrite(boardBulkWrites);
		}

		//create promise for accounts (clearing staff positions or deleting fuly)
		if (config.get.inactiveAccountAction === 2) {
			debugLogs && console.log(`Deleting ${inactiveAccounts.length} inactive accounts`);
			const inactiveUsernames = inactiveAccounts.map(acc => acc._id);
			if (inactiveUsernames.length > 0) {
				accountsPromise = Accounts.deleteMany(inactiveUsernames);
			}
		} else{
			debugLogs && console.log(`Removing staff positions from ${inactiveWithBoards.length} inactive accounts`);
			const inactiveUsernames = inactiveWithBoards.map(acc => acc._id);
			if (inactiveUsernames.length > 0) {
				accountsPromise = Accounts.clearStaffAndOwnedBoards(inactiveUsernames);
			}
		}
		
		//execute promises
		await Promise.all([
			accountsPromise,
			boardsPromise,
		]);
		
		//clear caches
		cacheDeleteSet.forEach(b => Redis.del(`board:${b}`));
		//users: cache already handled by Accounts.deleteMany or Accounts.clearStaffAndOwnedBoards

	},

	interval: timeUtils.DAY,
	immediate: true,
	condition: 'inactiveAccountAction'

};
