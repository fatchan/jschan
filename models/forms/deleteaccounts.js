'use strict';

const { Accounts, Boards } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, cache = require(__dirname+'/../../lib/redis/redis.js');

module.exports = async (req, res, next) => {

	const accountsWithBoards = await Accounts.getOwnedOrStaffBoards(req.body.checkedaccounts);
	if (accountsWithBoards.length > 0) {
		const bulkWrites = [];
		for (let i = 0; i < accountsWithBoards.length; i++) {
			const acc = accountsWithBoards[i];
			if (acc.staffBoards.length > 0) {
				//remove from staff of any boards they are mod on
				bulkWrites.push({
					'updateMany': {
						'filter': {
							'_id': {
								'$in': acc.staffBoards
							}
						},
						'update': {
							'$unset': {
								[`staff.${acc.username}`]: "",
							}
						}
					}
				});
				cache.del(acc.staffBoards.map(b => `board:${b}`));
			}
			if (acc.ownedBoards.length > 0) {
				//remove as owner of any boards they own
				bulkWrites.push({
					'updateMany': {
						'filter': {
							'_id': {
								'$in': acc.ownedBoards
							}
						},
						'update': {
							'$set': {
								'owner': null,
							},
							'$unset': {
								[`staff.${acc.username}`]: "",
							},
						}
					}
				});
				cache.del(acc.ownedBoards.map(b => `board:${b}`));
				//todo: use list of board with no owners for claims
			}
		}
		await Boards.db.bulkWrite(bulkWrites);
	}

	const amount = await Accounts.deleteMany(req.body.checkedaccounts).then(res => res.deletedCount);

	//and delete any of their active sessions
	await Promise.all(req.body.checkedaccounts.map((username) => {
		return cache.deletePattern(`sess:*:${username}`);
	}));

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': `Deleted ${amount} accounts`,
		'redirect': '/globalmanage/accounts.html'
	});

}
