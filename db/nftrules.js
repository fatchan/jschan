
'use strict';

const Mongo = require(__dirname+'/db.js')
	, cache = require(__dirname+'/../lib/redis/redis.js')
	, db = Mongo.db.collection('nftrules');

module.exports = {

	db,

	findForBoard: async (board=null, limit=0) => {
		let nftRules = await cache.get(`nftrules:${board}`);
		if (nftRules) {
			return nftRules === 'no_exist' ? [] : nftRules;
		} else {
			nftRules = await db.find({
				'board': board
			}).sort({
				'_id': -1
			})
				.limit(limit)
				.toArray();
			if (nftRules) {
				cache.set(`nftrules:${board}`, nftRules, 3600);
			} else {
				cache.set(`nftrules:${board}`, 'no_exist', 600);
			}
		}
		return nftRules;
	},

	count: (board=null) => {
		return db.countDocuments({'board': board});
	},

	findOne: (board=null, id) => {
		return db.findOne({
			'_id': id,
			'board': board,
		});
	},

	updateOne: async (board=null, id, network, contractAddress, abi, tokenId) => {
		const updatedNftRule = await db.updateOne({
			'_id': id,
			'board': board,
		}, {
			'$set': {
				network, contractAddress, abi, tokenId,
			}
		});
		await cache.del(`nftrules:${board}`);
		return updatedNftRule;
	},

	insertOne: async (nftRule) => {
		const insertedNftRule = await db.insertOne(nftRule);
		await cache.del(`nftrules:${nftRule.board}`);
		return insertedNftRule;
	},

	deleteMany: async (board=null, ids) => {
		const deletedNftRule = await db.deleteMany({
			'_id': {
				'$in': ids
			},
			'board': board
		});
		await cache.del(`nftrules:${board}`);
		return deletedNftRule;
	},

	deleteBoard: async (board=null) => {
		const deletedNftRules = await db.deleteMany({ 'board': board });
		await cache.del(`nftrules:${board}`);
		return deletedNftRules;
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

};
