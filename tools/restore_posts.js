'use strict';

/*
 * Restore a post or a full thread from a mongodump backup.
 */

(async () => {

	const Mongo = require(__dirname+'/../db/db.js')
		, { execSync } = require('child_process')
		, { EJSON } = require('bson')
		, config = require(__dirname+'/../lib/misc/config.js');

	console.log('CONNECTING TO MONGODB');
	await Mongo.connect();
	await Mongo.checkVersion();
	await config.load();
	const db = Mongo.db.collection('posts');

	if (process.argv.length !== 4) {
		console.error('Usage: node restore_posts.js PATH_TO_posts.bson OBJECT_ID_OF_POST');
		process.exit(2);
	}
	const path = process.argv[2];
	const post_object_id = process.argv[3];

	// for some reason, the node BSON package can't handle some mongodump BSON files like posts.bson
	// so we'll run bsondump to convert to JSON, then use EJSON from the BSON package to parse the special type information

	const postsdata = execSync(`bsondump --quiet --type json ${path}`, (error, stdout, stderr) => {
		if (error) {
			console.error(`error: ${error.message}`);
			process.exit(1);
		}

		if (stderr) {
			console.error(`stderr: ${stderr}`);
			process.exit(1);
		}

		return stdout;
	});

	// and, because it's a debug tool, bsondump outputs each document as a different json on a new line, instead of printing a valid json file
	const posts_json = EJSON.parse('['+postsdata.toString().replace(/}(\r\n|\n|\r){/gm, '},{')+']');

	// iterate over all the posts and find the one with the correct ID
	let i = 0;
	while (i < posts_json.length && posts_json[i]['_id'] != post_object_id) { i += 1; }
	if (i == posts_json.length) { console.log('Object ID not found in posts'); process.exit(2); }
	const data = posts_json[i];

	let res = await insertPost(db, data);
	console.log(res);

	// if the post doesn't have a parent thread, it is a thread. we need to insert the child posts too
	if (data.thread == null) {
		for (const e of posts_json) {
			if (e['thread'] == data['postId']) {
				// since posts are already indexed by postID, which contains a timestamp to the nearest second, there's no risk for a post trying to add a backlink before the target exists
				res = await insertPost(db, e);
				console.log(res);
			}
		}
	}
	console.log('Make sure to run `gulp html` and restore the attached files');
	process.exit();

})();

async function insertPost(db, data) {
	const postMongoId = await db.insertOne(data).then(result => result.insertedId); //_id of post
	const postId = data['postId'];
	const board = data['board'];
	
	//add backlinks to the posts this post quotes
	if (data.thread && data.quotes.length > 0) {
		await db.updateMany({
			'_id': {
				'$in': data.quotes.map(q => q._id)
			},
			
		}, {
			'$addToSet': {
				'backlinks': { _id: postMongoId, postId: postId }
			}
		});
	}

	//restore invalidated quotes now this post exists again
	if (data.thread && data.backlinks.length > 0) {
		const threadId = data['thread'];
		await db.updateMany({
			'_id': {
				'$in': data.backlinks.map(q => q._id)
			}
		},
		{
			'$addToSet': {
				'quotes': { _id: postMongoId, thread: threadId, postId: postId }
			}
		});
		await db.updateMany({
			'_id': {
				'$in': data.backlinks.map(q => q._id)
			}
		},
		
		[{
			'$set': {
				message: {
					$replaceOne: { input: '$message', find: `<span class="invalid-quote">&gt;&gt;${postId}</span>`, replacement: `<a class="quote" href="/${board}/thread/${threadId}.html#${postId}">&gt;&gt;${postId}</a>` }
				}
			}
		}]
		);
	}

	return ({ postId, postMongoId });
}
