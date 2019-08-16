'use strict';

const { Posts } = require(__dirname+'/../../db/');

module.exports = (req, res, posts) => {

	const report = {
		'reason': req.body.report_reason,
		'date': new Date(),
		'ip': res.locals.ip
	}

	return {
		message: `Global reported ${posts.length} post(s)`,
		action: '$push',
		query: {
			'globalreports': {
				'$each': [report],
				'$slice': -5
			}
		}
	};

}
