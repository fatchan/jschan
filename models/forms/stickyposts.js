'use strict';

const { NumberInt } = require(__dirname+'/../../db/db.js');

module.exports = (locals, sticky) => {

	const { posts, __, __n } = locals;

	const filteredposts = posts.filter(post => {
		return !post.thread;
	});

	if (filteredposts.length === 0) {
		return {
			message: __('No threads selected to Sticky'),
		};
	}

	const stickyValue = NumberInt(sticky);

	return {
		message: __n('Set Sticky level for %s threads to %s', 'Set Sticky level for %s threads to %s', filteredposts.length, sticky),
		action: '$set',
		query: {
			'sticky': stickyValue,
		}
	};

};
