'use strict';

const Mongo = require(__dirname+'/../helpers/db.js')
	, db = Mongo.client.db('jschan').collection('tripcodes');

module.exports = {

	findOne: (password) => {
		return db.findOne({ '_id': password });
	},

	insertOne: (password, trip) => {
		return db.insertOne({ '_id': password, 'code': trip });
	},

	deleteAll: () => {
		return db.deleteMany({});
	},

}
