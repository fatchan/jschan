'use strict';

module.exports = (posts) => {

	const filteredposts = posts.filter(post => {
		return post.globalreports.length > 0;
	});

	if (filteredposts.length === 0) {
		return {
			message: 'No global report(s) to dismiss'
		};
	}

	return {
		message: 'Dismissed global report(s)',
		action: '$set',
		query: {
			'globalreports': []
		}
	};

};
