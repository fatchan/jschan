'use strict';

module.exports = (posts) => {

	const filteredposts = posts.filter(post => {
		return !post.sticky
	})

	if (filteredposts.length === 0) {
		return {
			message: 'Post(s) already stickied',
		};
	}

	return {
		message: `Stickied ${filteredposts.length} post(s)`,
		action: '$set',
		query: {
			'sticky': true
		}
	};

}
