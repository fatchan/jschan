'use strict';

const Posts = require(__dirname+'/../../db-models/posts.js');

module.exports = async (req, res) => {

	const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
	const report = {
		'reason': req.body.reason,
		'date': new Date(),
		'ip': ip
	}

	//push the report to all checked posts
	await Posts.reportMany(req.params.board, req.body.checked, report);

	//hooray!
	return `Reported post(s) successfully`

}
