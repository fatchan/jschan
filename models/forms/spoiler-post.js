'use strict';

module.exports = (posts) => {

	// filter to ones not spoilered
	const filteredPosts = posts.filter(post => {
  		return !post.spoiler
	});

	if (filteredPosts.length === 0) {
		return {
			message:'Post(s) already spoilered'
		};
	}

	return {
		message: `Spoilered ${filteredPosts.length} post(s)`,
		action: '$set',
		query: {
			'spoiler': true
		}
	};

}
