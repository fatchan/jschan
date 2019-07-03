'use strict';

module.exports = (posts) => {

	const filteredposts = posts.filter(post => {
		return !post.thread && !post.locked
	})

	if (filteredposts.length === 0) {
		return {
			message: 'No thread(s) to lock',
		};
	}

	return {
		message: `Locked ${filteredposts.length} thread(s)`,
		action: '$set',
		query: {
			'locked': true
		}
	};

}
