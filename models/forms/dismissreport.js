'use strict';

module.exports = (req, res) => {

	const filteredposts = res.locals.posts.filter(post => {
		return (req.body.global_dismiss && post.globalreports.length > 0)
			|| (req.body.dismiss && post.reports.length > 0);
	});

	if (filteredposts.length === 0) {
		return {
			message: 'No report(s) to dismiss'
		};
	}

	const ret = {
		message: 'Dismissed reports',
		action: '$set',
		query: {}
	};
	ret.query[`${req.body.global_dismiss ? 'global' : ''}reports`] = [];

	return ret;

};
