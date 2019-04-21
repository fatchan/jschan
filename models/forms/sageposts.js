'use strict';

module.exports = (posts) => {

	const filteredposts = posts.filter(post => {
		return !post.thread && !post.saged
	})

	if (filteredposts.length === 0) {
		return {
			message: 'No thread(s) to sage',
		};
	}

	return {
		message: `Saged ${filteredposts.length} post(s)`,
		action: '$set',
		query: {
			'saged': true
		}
	};

}
