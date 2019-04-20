'use strict';

const path = require('path')
	, util = require('util')
	, fs = require('fs')
	, unlink = util.promisify(fs.unlink)
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
	, hasPerms = require(__dirname+'/../../helpers/hasperms.js')
	, Mongo = require(__dirname+'/../../db/db.js')
	, Posts = require(__dirname+'/../../db/posts.js');

module.exports = async (req, res, next, posts) => {

	// filter to ones not spoilered
	posts = posts.filter(post => {
  		return !post.spoiler
	});
	if (posts.length === 0) {
		return 'Posts already spoilered';
	}

	// spoiler posts
	const postMongoIds = posts.map(post => Mongo.ObjectId(post._id));
	const spoileredPosts = await Posts.spoilerMany(postMongoIds).then(result => result.modifiedCount);

	//hooray!
	return `Spoilered ${spoileredPosts} posts`

}
