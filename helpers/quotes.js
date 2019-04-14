'use strict';

const Posts = require(__dirname+'/../db-models/posts.js')
	, quoteRegex = />>\d+/gm;

module.exports = async (board, text) => {

	//get the matches
	const matches = text.match(quoteRegex);
	if (!matches) {
		return text;
	}

	//get all the Ids
	const quoteIds = matches.map(x => +x.substring(2));

	//get all posts with those Ids 
	const posts = await Posts.getPosts(board, quoteIds, false);

	//turn the result into a map of postId => threadId/postId
	const postThreadObject = {};
	let validQuotes = 0;
	for (let i = 0; i < posts.length; i++) {
		const post = posts[i];
		postThreadObject[post.postId] = post.thread || post.postId;
		validQuotes++;
	}

	//if none of the quotes were real, dont do a replace
	if (validQuotes === 0) {
		return text;
	}

	//then replace the quotes with only ones that exist
	text = text.replace(quoteRegex, (match) => {
		const quotenum = +match.substring(2);
		if (postThreadObject[quotenum]) {
			return `<a class='quote' href='/${board}/thread/${postThreadObject[quotenum]}#${quotenum}'>&gt;&gt;${quotenum}</a>`;
		}
		return match;
	});

	return text;

}
