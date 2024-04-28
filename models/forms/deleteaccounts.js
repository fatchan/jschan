'use strict';

const { Accounts, Boards } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, deleteBoard = require(__dirname+'/../../models/forms/deleteboard.js')
	, cache = require(__dirname+'/../../lib/redis/redis.js');

module.exports = async (req, res) => {

	const { __, __n } = res.locals;
	const accountsWithBoards = await Accounts.getOwnedOrStaffBoards(req.body.checkedaccounts);
	const checkedDeleteOwnedBoards = new Set(req.body.delete_owned_boards||[]);
	// console.log('checkedDeleteOwnedBoards', checkedDeleteOwnedBoards);
	const deleteCacheBoards = new Set();
	const deleteBoards = new Set();
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
								[`staff.${acc._id}`]: '',
							}
						}
					}
				});
				acc.staffBoards.forEach(sb => deleteCacheBoards.add(`board:${sb}`));
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
								[`staff.${acc._id}`]: '',
							},
						}
					}
				});
				acc.ownedBoards.forEach(ob => {
					deleteCacheBoards.add(`board:${ob}`);
					if (checkedDeleteOwnedBoards.has(acc._id)) {
						deleteBoards.add(ob);
					}
				});
			}
		}
		await Boards.db.bulkWrite(bulkWrites);
		//invalidate caches for any board they were owner/staff of
		cache.del([...deleteCacheBoards]);
	}

	const amount = await Accounts.deleteMany(req.body.checkedaccounts).then(res => res.deletedCount);
	if (deleteBoards.size > 0) {
		await Promise.all([...deleteBoards].map(async uri => {
			const _board = await Boards.findOne(uri);
			return deleteBoard(uri, _board);
		}));
	}

	//invalidate any of their active sessions
	await cache.del(req.body.checkedaccounts.map(username => `sess:*:${username}`));

	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __n('Deleted %s accounts', amount),
		'redirect': '/globalmanage/accounts.html'
	});

};
