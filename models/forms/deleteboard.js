'use strict';

const { Boards, Stats, Posts, Bans, Modlogs } = require(__dirname+'/../../db/')
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
	await Promise.all([
		Modlogs.deleteBoard(uri), //modlogs for the board
		Bans.deleteBoard(uri), //bans for the board
		Stats.deleteBoard(uri), //stats for the board
		remove(`${uploadDirectory}html/${uri}/`), //html
		remove(`${uploadDirectory}json/${uri}/`) //json
	]);

}
