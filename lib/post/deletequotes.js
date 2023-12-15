'use strict';

//use simple string replacement and filter to remove dead quotes, instead of running the whole messagehandler again
module.exports = (deletedPosts, updateQuotePosts) => {
	const bulkWrites = [];
	updateQuotePosts.forEach(post => {
		deletedPosts.forEach(ap => {
			const quotesBefore = post.quotes.length;
			post.quotes = post.quotes.filter(q => q.postId !== ap.postId);
			if (quotesBefore !== post.quotes.length) { //optimization, probably
				post.message = post.message.replace(
					`<a class="quote" href="/${ap.board}/thread/${ap.thread}.html#${ap.postId}">&gt;&gt;${ap.postId}</a>`,
					`<span class="invalid-quote">&gt;&gt;${ap.postId}</span>`
				);
			}
		});
		bulkWrites.push({
			'updateOne': {
				'filter': {
					'_id': post._id
				},
				'update': {
					'$set': {
						'quotes': post.quotes,
						'message': post.message,
					}
				}
			}
		});
	});
	return bulkWrites;
};
