'use strict';

const Posts = require(__dirname+'/../../db/posts.js');

module.exports = async (req, res, next) => {

	const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
	const report = {
		'reason': req.body.report_reason,
		'date': new Date(),
		'ip': ip
	}

	//push the report to all checked posts
	await Posts.reportMany(req.params.board, req.body.checkedposts, report);

	//hooray!
	return `Reported post(s) successfully`

}
