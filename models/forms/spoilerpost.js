'use strict';

module.exports = (locals) => {

	const { __, __n, posts } = locals;

	// filter to ones not spoilered
	const filteredPosts = posts.filter(post => {
		return !post.spoiler && post.files.length > 0;
	});

	if (filteredPosts.length === 0) {
		return {
			message: __('No files to spoiler'),
		};
	}

	return {
		message: __n('Spoilered %s posts', filteredPosts.length),
		action: '$set',
		query: {
			'spoiler': true
		}
	};

};
