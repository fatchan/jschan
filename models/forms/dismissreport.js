'use strict';

module.exports = (req, res) => {

	const { posts, __ } = res.locals;

	const filteredposts = posts.filter(post => {
		return (req.body.global_dismiss && post.globalreports.length > 0)
			|| (req.body.dismiss && post.reports.length > 0);
	});

	if (filteredposts.length === 0) {
		return {
			message: __('No reports to dismiss'),
		};
	}

	const ret = {
		message: __('Dismissed reports'),
		action: '$set',
		query: {}
	};
	ret.query[`${req.body.global_dismiss ? 'global' : ''}reports`] = [];

	return ret;

};
