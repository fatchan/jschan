'use strict';

const { NumberInt } = require(__dirname+'/../../db/db.js');

module.exports = (posts, sticky) => {

	const filteredposts = posts.filter(post => {
		return !post.thread;
	});

	if (filteredposts.length === 0) {
		return {
			message: 'No thread(s) to sticky',
		};
	}

	const stickyValue = NumberInt(sticky);

	return {
		message: `Set sticky for ${filteredposts.length} thread(s) to ${sticky}`,
		action: '$set',
		query: {
			'sticky': stickyValue,
		}
	};

};
