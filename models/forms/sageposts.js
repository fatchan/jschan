'use strict';

const { NumberInt } = require(__dirname+'/../../db/db.js')

module.exports = (posts) => {

	const filteredposts = posts.filter(post => {
		return !post.thread
	})

	if (filteredposts.length === 0) {
		return {
			message: 'No thread(s) to sage',
		};
	}

	return {
		message: `Toggled Permasage for ${filteredposts.length} thread(s)`,
		action: '$bit',
		query: {
			'saged': {
				'xor': NumberInt(1)
			},
		}
	};

}
