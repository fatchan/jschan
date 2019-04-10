'use strict';

const path = require('path')
	, util = require('util')
	, fs = require('fs')
	, unlink = util.promisify(fs.unlink)
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
	, hasPerms = require(__dirname+'/../../helpers/has-perms.js')
	, Posts = require(__dirname+'/../../db-models/posts.js');

module.exports = async (req, res) => {

	//get all posts that were checked
	let posts;
	try {
		posts = await Posts.getPosts(req.params.board, req.body.checked, true); //admin arument true, fetches passwords and salts
	} catch (err) {
		console.error(err);
		return res.status(500).render('error');
	}

	if (!posts || posts.length === 0) {
		return res.status(400).render('message', {
			'title': 'Bad requests',
			'message': 'No posts found',
			'redirect': `/${req.params.board}`
		});
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
			return res.status(403).render('message', {
				'title': 'Forbidden',
				'message': 'Password did not match any selected posts',
				'redirect': `/${req.params.board}`
			});
		}

	}

	//filter by not spoilered
	posts = posts.filter(post => {
  		return !post.spoiler
	});
	if (posts.length === 0) {
		return res.status(409).render('message', {
			'title': 'Conflict',
			'message': 'Selected posts are already spoilered',
			'redirect': `/${req.params.board}`
		});
	}

	// spoiler posts
	let spoileredPosts = 0;
	try {
		const result = await Posts.spoilerMany(req.params.board, posts.map(x => x.postId));
		spoileredPosts = result.modifiedCount;
	} catch (err) {
		console.error(err);
		return res.status(500).render('error');
	}

	//hooray!
	return res.render('message', {
		'title': 'Success',
		'message': `Spoilered ${spoileredPosts} posts`,
		'redirect': `/${req.params.board}`
	});

}
