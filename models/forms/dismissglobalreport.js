'use strict';

const Mongo = require(__dirname+'/../../db/db.js')
	, Posts = require(__dirname+'/../../db/posts.js')
	, hasPerms = require(__dirname+'/../../helpers/hasperms.js');

module.exports = async (req, res, next, posts) => {

	const postMongoIds = posts.map(post => Mongo.ObjectId(post._id))
	const dismissedCount = await Posts.dismissGlobalReports(postMongoIds).then(result => result.modifiedCount);

	return `Dismissed ${dismissedCount} reports successfully`;

}
