'use strict';

module.exports = (posts) => {

	const filteredposts = posts.filter(post => {
		return post.reports.length > 0
	})

	if (filteredposts.length === 0) {
		return {
			message: 'No report(s) to dismiss'
		}
	}

	return {
		message: 'Dismissed reports',
		action: '$set',
		query: {
			'reports': []
		}
	};

}
