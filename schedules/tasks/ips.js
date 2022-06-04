'use strict';

const Mongo = require(__dirname+'/../../db/db.js')
	, { Posts, Modlogs } = require(__dirname+'/../../db/')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, { createHash, randomBytes } = require('crypto')
	, timeUtils = require(__dirname+'/../../lib/converter/timeutils.js');

module.exports = {

	func: async (days) => {

		//make a mongoid set to the date before which we prunt IPs on, because _id holds date and is always indexed
		const beforeDate = new Date();
		beforeDate.setDate(beforeDate.getDate() - (days || config.get.pruneIps));
		const beforeDateMongoId = Mongo.ObjectId.createFromTime(Math.floor(beforeDate.getTime()/1000));

		//use random secret for this schedule run and generate the bulkwrite for pruning IP
		const tempIpHashSecret = randomBytes(20).toString('base64');
		const mapBulkWrite = (document) => {
			const randomIP = createHash('sha256').update(tempIpHashSecret + document.ip.cloak).digest('base64');
			return {
				updateOne: {
					filter: {
						_id: document._id,
					},
					update: {
						$set: {
							'ip.pruned': true,
							'ip.raw': `${randomIP.slice(-10)}.PRUNED`,
							'ip.cloak': `${randomIP.slice(-10)}.PRUNED`,
						}
					}
				}
			};
		};

		const pruneQuery = {
			'_id': {
				'$lte': beforeDateMongoId,
			},
			'ip.pruned': {
				'$ne': true
			}
		};

		//No need for promise.all
		[Posts, Modlogs].forEach(async (coll, i) => {
			const bulkWrites = (await coll.db
				.find(pruneQuery)
				.toArray())
				.map(mapBulkWrite);
			if (bulkWrites.length > 0) {
				await coll.db.bulkWrite(bulkWrites);
				console.log(`Randomised ips on ${bulkWrites.length} ${i === 0 ? 'posts' : 'modlog entries'}`);
			}
		});

	},

	interval: timeUtils.DAY,
	immediate: true,
	condition: 'pruneIps',

};
