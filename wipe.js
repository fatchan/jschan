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
	const Boards = require(__dirname+'/db-models/boards.js')
		, Posts = require(__dirname+'/db-models/posts.js')
		, Trips = require(__dirname+'/db-models/trips.js');
	console.log('connected! wiping data')
	await Boards.deleteIncrement('pol');
	await Boards.deleteIncrement('b');
	await Posts.deleteAll('pol');
	await Posts.deleteAll('b');
	await Boards.deleteAll();
	await Trips.deleteAll();
	await Boards.insertOne({
		 _id: 'pol',
		 name: 'Politically Incorrect',
		 description: 'Political posts go here.',
	})
	await Boards.insertOne({
		 _id: 'b',
		 name: 'Random',
		 description: 'post anything here',
	})
	await Posts.db.collection('b').createIndex({"thread": 1});
	await Posts.db.collection('pol').createIndex({"thread": 1});
	await readdir('static/img/').then(async files => {
		await Promise.all(files.map(async file => {
			unlink(path.join('static/img/', file));
		}))
	});
	console.log('done')
	return;
})();

