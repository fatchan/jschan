'use strict';

module.exports = (posts) => {

	const filteredposts = posts.filter(post => {
		return !post.locked
	})

	if (filteredposts.length === 0) {
		return {
			message: 'Post(s) already locked',
		};
	}

	return {
		message: `Locked ${filteredposts.length} post(s)`,
		action: '$set',
		query: {
			'locked': true
		}
	};

}
