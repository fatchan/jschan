'use strict';

const { NumberInt } = require(__dirname+'/../../db/db.js');

module.exports = (posts) => {

	const filteredposts = posts.filter(post => {
		return !post.thread;
	});

	if (filteredposts.length === 0) {
		return {
			message: 'No thread(s) to cycle',
		};
	}

	return {
		message: `Toggled Cyclical mode for ${filteredposts.length} thread(s)`,
		action: '$bit',
		query: {
			'cyclic': {
				'xor': NumberInt(1)
			},
		}
	};

};
