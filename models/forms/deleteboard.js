'use strict';

const { CustomPages, Accounts, Boards, Stats, Posts, Bans, Modlogs } = require(__dirname+'/../../db/')
	, deletePosts = require(__dirname+'/deletepost.js')
	, uploadDirectory = require(__dirname+'/../../lib/file/uploaddirectory.js')
	, { remove } = require('fs-extra');

module.exports = async (uri, board) => {

	//delete board
	await Boards.deleteOne(uri);
	//get all posts (should probably project to get files for deletin and anything else necessary)
	const allPosts = await Posts.allBoardPosts(uri);
	if (allPosts.length > 0) {
		//delete posts and decrement images
		await deletePosts(allPosts, uri, true);
	}
	await Promise.all([
		Accounts.removeOwnedBoard(board.owner, uri), //remove board from owner account
		Object.keys(board.staff).length > 0 ? Accounts.removeStaffBoard(Object.keys(board.staff), uri) : void 0, //remove staffboard from staff accounts
		Modlogs.deleteBoard(uri), //modlogs for the board
		Bans.deleteBoard(uri), //bans for the board
		Stats.deleteBoard(uri), //stats for the board
		CustomPages.deleteBoard(uri), //custom pages for the board
		remove(`${uploadDirectory}/html/${uri}/`), //html
		remove(`${uploadDirectory}/json/${uri}/`), //json
		remove(`${uploadDirectory}/banner/${uri}/`), //banners
		remove(`${uploadDirectory}/flag/${uri}/`), //flags
		remove(`${uploadDirectory}/asset/${uri}/`), //assets
	]);

}
