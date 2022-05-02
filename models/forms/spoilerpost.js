'use strict';

module.exports = (posts) => {

	// filter to ones not spoilered
	const filteredPosts = posts.filter(post => {
		return !post.spoiler && post.files.length > 0;
	});

	if (filteredPosts.length === 0) {
		return {
			message:'No post(s) to spoiler'
		};
	}

	return {
		message: `Spoilered ${filteredPosts.length} post(s)`,
		action: '$set',
		query: {
			'spoiler': true
		}
	};

};
