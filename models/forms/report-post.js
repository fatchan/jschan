'use strict';

const Posts = require(__dirname+'/../../db-models/posts.js');

module.exports = async (req, res, next) => {

	const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
	const report = {
		'reason': req.body.reason,
		'date': new Date(),
		'ip': ip
	}

	//push the report to all checked posts
	try {
		await Posts.reportMany(req.params.board, req.body.checked, report);
	} catch (err) {
		return next(err);
	}

	//hooray!
	return `Reported post(s) successfully`

}
