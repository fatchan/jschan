'use strict';

module.exports = (posts) => {

	const filteredposts = posts.filter(post => {
		return !post.saged
	})

	if (filteredposts.length === 0) {
		return {
			message: 'Post(s) already saged',
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
