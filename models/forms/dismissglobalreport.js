'use strict';

module.exports = (locals) => {

	const { posts, __ } = locals;
	
	const filteredposts = posts.filter(post => {
		return post.globalreports.length > 0;
	});

	if (filteredposts.length === 0) {
		return {
			message: __('No global reports to dismiss'),
		};
	}

	return {
		message: __('Dismissed global reports'),
		action: '$set',
		query: {
			'globalreports': []
		}
	};

};
