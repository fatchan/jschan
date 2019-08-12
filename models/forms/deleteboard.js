'use strict';

const Boards = require(__dirname+'/../../db/boards.js')
	, Posts = require(__dirname+'/../../db/posts.js')
	, Bans = require(__dirname+'/../../db/bans.js')
	, deletePosts = require(__dirname+'/deletepost.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, { remove } = require('fs-extra');

module.exports = async (uri) => {

	//delete board
	await Boards.deleteOne(uri);
	//get all posts (should probably project to get files for deletin and anything else necessary)
	const allPosts = await Posts.allBoardPosts(uri);
	if (allPosts.length > 0) {
		//delete posts and decrement images
		await deletePosts(allPosts, uri, true);
	}
	//bans for the board are pointless now
	await Bans.deleteBoard(uri);
	//remove all pages for the board
	await remove(`${uploadDirectory}html/${uri}/`)

//todo: maybe put some of this in parallel

}
