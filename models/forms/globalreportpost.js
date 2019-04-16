'use strict';

const Mongo = require(__dirname+'/../../db/db.js')
	, Posts = require(__dirname+'/../../db/posts.js');

module.exports = async (req, res, next, posts) => {

	const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
	const report = {
		'reason': req.body.report_reason,
		'date': new Date(),
		'ip': ip
	}

	const ids = posts.map(p => Mongo.ObjectId(p._id))

	//push the report to all checked posts
	const reportedPosts = await Posts.globalReportMany(ids, report).then(result => result.modifiedCount);

	//hooray!
	return `Global reported ${reportedPosts} posts successfully`

}
