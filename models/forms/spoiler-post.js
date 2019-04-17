'use strict';

const path = require('path')
	, util = require('util')
	, fs = require('fs')
	, unlink = util.promisify(fs.unlink)
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
	, hasPerms = require(__dirname+'/../../helpers/hasperms.js')
	, Mongo = require(__dirname+'/../../db/db.js')
	, Posts = require(__dirname+'/../../db/posts.js');

module.exports = async (req, res, next, checkedPosts) => {

	//get all posts that were checked
	let posts = checkedPosts;

	//if user is not logged in OR if lgoged in but not authed, filter the posts by passwords that are not null
	if (!hasPerms(req, res)) {

		//filter by password
		posts = posts.filter(post => {
	  		return post.password != null
			&& post.password.length > 0
			&& post.password == req.body.password
		});
		if (posts.length === 0) {
			throw {
				'status': 403,
				'message': {
					'title': 'Forbidden',
					'message': 'Password did not match any selected posts',
					'redirect': '/'
				}
			};
		}

	}

	//filter by not spoilered. maybe i add filters with optiins in the controller where it gets the posts?
	posts = posts.filter(post => {
  		return !post.spoiler
	});
	if (posts.length === 0) {
		throw {
			'status': 409,
			'message': {
				'title': 'Conflict',
				'message': 'Posts already spoilered',
				'redirect': '/'
			}
		};
	}

	// spoiler posts
	const postMongoIds = posts.map(post => Mongo.ObjectId(post._id));
	const spoileredPosts = await Posts.spoilerMany(postMongoIds).then(result => result.modifiedCount);

	//hooray!
	return `Spoilered ${spoileredPosts} posts`

}
