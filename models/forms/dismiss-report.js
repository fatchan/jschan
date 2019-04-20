'use strict';

const Posts = require(__dirname+'/../../db/posts.js')
	, hasPerms = require(__dirname+'/../../helpers/hasperms.js');

module.exports = async (req, res, next) => {

	const dismissedReports = await Posts.dismissReports(req.params.board, req.body.checkedposts).then(result => result.modifiedCount);

	return `Dismissed ${dismissedReports} reports successfully`;

}
