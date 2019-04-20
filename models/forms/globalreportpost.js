'use strict';

const Posts = require(__dirname+'/../../db/posts.js');

module.exports = (req, posts) => {

	const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
	const report = {
		'reason': req.body.report_reason,
		'date': new Date(),
		'ip': ip
	}

	return {
		message: `Global reported ${posts.length} post(s)`,
		action: '$push',
		query: {
			'globalreports': report
		}
	};

}
