'use strict';

const Mongo = require(__dirname+'/db.js')
	, db = Mongo.client.db('jschan')
	, captcha = db.collection('captcha')
	, ratelimit = db.collection('ratelimit')

module.exports = {

	captcha,

	ratelimit,

	findOne: (id) => {
		return captcha.findOne({ '_id': id });
	},

	insertOne: (text) => {
		return captcha.insertOne({
			'text': text,
			'expireAt': new Date()
		});
	},

	findOneAndDelete: (id, text) => {
		return captcha.findOneAndDelete({
			'_id': id,
			'text': text
		});
	},

	incrmentQuota: (ip) => {
		return ratelimit.findOneAndUpdate(
            {
                '_id': ip
            },
            {
                '$inc': {
                    'sequence_value': 1
                },
				'$setOnInsert': {
					'expireAt': new Date()
				}
            },
            {
				'upsert': true
            }
        ).then(r => { return r.value ? r.value.sequence_value : 0 });
	},

	deleteAll: () => {
		return Promise.all([
			captcha.deleteMany({}),
			ratelimit.deleteMany({})
		]);
	},

}
