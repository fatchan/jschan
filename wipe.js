'use strict';

const Mongo = require(__dirname+'/helpers/db.js')
	, util = require('util')
	, path = require('path')
	, fs = require('fs')
	, unlink = util.promisify(fs.unlink)
	, readdir = util.promisify(fs.readdir);

(async () => {
	console.log('connecting to db...')
	await Mongo.connect();
	const Boards = require(__dirname+'/db/boards.js')
		, Posts = require(__dirname+'/db/posts.js')
		, Bans = require(__dirname+'/db/bans.js')
		, Trips = require(__dirname+'/db/trips.js')
		, Accounts = require(__dirname+'/db/accounts.js');
	console.log('deleting accounts')
	await Accounts.deleteAll();
	console.log('deleting posts')
	await Posts.deleteAll('pol');
	await Posts.deleteAll('b');
	console.log('deleting boards')
	await Boards.deleteIncrement('pol');
	await Boards.deleteIncrement('b');
	await Boards.deleteAll();
	await Trips.deleteAll();
	console.log('deleting bans');
	await Bans.deleteAll();
	console.log('adding b and pol')
	await Boards.insertOne({
		 _id: 'pol',
		 name: 'Politically Incorrect',
		 description: 'Political posts go here.',
		owner: '',
		moderators: [],
	})
	await Boards.insertOne({
		 _id: 'b',
		 name: 'Random',
		 description: 'post anything here',
		owner: '',
		moderators: [],
	})
	console.log('creating indexes')
	await Bans.db.dropIndexes();
	await Bans.db.createIndex({ "expireAt": 1 }, { expireAfterSeconds: 0 });
	await Posts.db.dropIndexes();
	//these are fucked
	await Posts.db.createIndex({
		'postId': 1,
		'board': 1,
	});
	await Posts.db.createIndex({
		'board': 1,
		'thread': 1,
		'bumped': -1
	});
	await Posts.db.createIndex({
		'board': 1,
		'reports.0': 1
	}, {
		partialFilterExpression: {
			'reports.0': {
				'$exists': true
			}
		}
	});
	await readdir('static/img/').then(async files => {
		await Promise.all(files.map(async file => {
			if (file != 'spoiler.png')
				unlink(path.join('static/img/', file));
		}))
	});
	console.log('creating admin account: admin:changeme');
	await Accounts.insertOne('admin', 'changeme', 3);
	console.log('done');
})();
