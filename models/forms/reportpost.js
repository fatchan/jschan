'use strict';

const Posts = require(__dirname+'/../../db/posts.js');

module.exports = (req, res, posts) => {

	const report = {
		'reason': req.body.report_reason,
		'date': new Date(),
		'ip': res.locals.ip
	}

	return {
		message: `Reported ${posts.length} post(s)`,
		action: '$push',
		query: {
			'reports': {
				'$each': [report],
				'$slice': -5 //limit number of  reports
			}
		}
	};

}
