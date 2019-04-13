'use strict';

const path = require('path')
	, util = require('util')
	, fs = require('fs')
	, unlink = util.promisify(fs.unlink)
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
	, hasPerms = require(__dirname+'/../../helpers/hasperms.js')
	, Posts = require(__dirname+'/../../db-models/posts.js');

module.exports = async (req, res, next, checkedPosts) => {

	//get all posts that were checked
	let posts = checkedPosts;

	if (!posts || posts.length === 0) {
		throw {
			'status': 400,
			'message': {
				'title': 'Bad requests',
				'message': 'No posts found',
				'redirect': `/${req.params.board}`
			}
		};
	}

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
					'redirect': `/${req.params.board}`
				}
			};
		}

	}

	//filter by not spoilered
	posts = posts.filter(post => {
  		return !post.spoiler
	});
	if (posts.length === 0) {
		throw {
			'status': 409,
			'message': {
				'title': 'Conflict',
				'message': 'Posts already spoilered',
				'redirect': `/${req.params.board}`
			}
		};
	}

	// spoiler posts
	let spoileredPosts = 0;
	try {
		spoileredPosts = await Posts.spoilerMany(req.params.board, posts.map(x => x.postId)).then(result => result.modifiedCount);
	} catch (err) {
		return next(err);
	}

	//hooray!
	return `Spoilered ${spoileredPosts} posts`

}
