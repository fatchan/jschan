'use strict';

module.exports = (posts) => {

	const filteredposts = posts.filter(post => {
		return !post.thread && !post.cyclic
	})

	if (filteredposts.length === 0) {
		return {
			message: 'No thread(s) to cycle',
		};
	}

	return {
		message: `Cycled ${filteredposts.length} thread(s)`,
		action: '$set',
		query: {
			'cyclic': true,
		}
	};

}
