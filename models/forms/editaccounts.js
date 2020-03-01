'use strict';

const { Accounts, Boards } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, cache = require(__dirname+'/../../redis.js')

module.exports = async (req, res, next) => {

	//edit the accounts
	let amount = 0;
	if (req.body.delete_account) {
		const accountsWithBoards = await Accounts.getOwnedOrModBoards(req.body.checkedaccounts);
		if (accountsWithBoards.length > 0) {
			const bulkWrites = [];
			for (let i = 0; i < accountsWithBoards.length; i++) {
				const acc = accountsWithBoards[i];
				if (acc.modBoards.length > 0) {
					//remove from moderators of any boards they are mod on
					bulkWrites.push({
						'updateMany': {
							'filter': {
								'_id': {
									'$in': acc.modBoards
								}
							},
							'update': {
								'$pull': {
									'settings.moderators': acc._id
								}
							}
						}
					});
					cache.del(acc.modBoards.map(b => `board:${b}`));
				}
				if (acc.ownedBoards.length > 0) {
					//remove from moderators of any boards they are mod on
					bulkWrites.push({
						'updateMany': {
							'filter': {
								'_id': {
									'$in': acc.ownedBoards
								}
							},
							'update': {
								'$set': {
									'owner': null //board has no owner
								}
							}
						}
					});
					cache.del(acc.ownedBoards.map(b => `board:${b}`));
//todo: use list of board with no owners for claims
				}
			}
			await Boards.db.bulkWrite(bulkWrites);
		}
		amount = await Accounts.deleteMany(req.body.checkedaccounts).then(res => res.deletedCount);
	} else {
		amount = await Accounts.setLevel(req.body.checkedaccounts, req.body.auth_level).then(res => res.modifiedCount);
	}

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': `${req.body.delete_account ? 'Deleted' : 'Edited'} ${amount} accounts`,
		'redirect': '/globalmanage/accounts.html'
	});

}
