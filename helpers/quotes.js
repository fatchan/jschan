'use strict';

const Posts = require(__dirname+'/../db/posts.js')
	, Boards = require(__dirname+'/../db/posts.js')
	, quoteRegex = />>\d+/g
	, crossQuoteRegex = />>>\/\w+\/\d+/g;

module.exports = async (board, text) => {

	//get the matches
	const quotes = text.match(quoteRegex);
	const crossQuotes = text.match(crossQuoteRegex);
	if (!quotes && !crossQuotes) {
		return text;
	}

	//make query for db including crossquotes
	const queryOrs = []
	const crossQuoteMap = {};
	if (quotes) {
		const quoteIds = quotes.map(q => +q.substring(2));
		queryOrs.push({
			'board': board,
			'postId': {
				'$in': quoteIds
			}
		});
	}
	if (crossQuotes) {
		for (let i = 0; i < crossQuotes.length; i++) {
			const crossQuote = crossQuotes[i].split('/');
			const crossQuoteBoard = crossQuote[1];
			const crossQuotePostId = +crossQuote[2];
			if (crossQuoteBoard === board) {
				continue;
			}
			if (!crossQuoteMap[crossQuoteBoard]) {
				crossQuoteMap[crossQuoteBoard] = [];
			}
			crossQuoteMap[crossQuoteBoard].push(crossQuotePostId);
		}
		const crossQuoteBoards = Object.keys(crossQuoteMap)
		for (let i = 0; i < crossQuoteBoards.length; i++) {
			const crossQuoteBoard = crossQuoteBoards[i];
			const crossQuoteBoardPostIds = crossQuoteMap[crossQuoteBoard];
			queryOrs.push({
				'board': crossQuoteBoard,
				'postId': {
					'$in': crossQuoteBoardPostIds
				}
			})
		}
	}

	//get all the posts from quotes
	const posts = await Posts.getPostsForQuotes(queryOrs);
	//if none of the quotes were real, dont do a replace
	if (posts.length === 0) {
		return text;
	}

	//turn the result into a map of postId => threadId/postId
	const postThreadIdMap = {};
	for (let i = 0; i < posts.length; i++) {
		const post = posts[i];
		if (!postThreadIdMap[post.board]) {
			postThreadIdMap[post.board] = {};
		}
		postThreadIdMap[post.board][post.postId] = post.thread || post.postId;
	}

	//then replace the quotes with only ones that exist
	if (quotes) {
		text = text.replace(quoteRegex, (match) => {
			const quotenum = +match.substring(2);
			if (postThreadIdMap[board] && postThreadIdMap[board][quotenum]) {
				return `<a class='quote' href='/${board}/thread/${postThreadIdMap[board][quotenum]}#${quotenum}'>&gt;&gt;${quotenum}</a>`;
			}
			return match;
		});
	}
	if (crossQuotes) {
		text = text.replace(crossQuoteRegex, (match) => {
			const quote = match.split('/');
			const quoteboard = quote[1];
			const quotenum = +quote[2];
			if (postThreadIdMap[quoteboard] && postThreadIdMap[quoteboard][quotenum]) {
				return `<a class='quote' href='/${quoteboard}/thread/${postThreadIdMap[quoteboard][quotenum]}#${quotenum}'>&gt;&gt;&gt;/${quoteboard}/${quotenum}</a>`;
			}
			return match;
		});
	}

	return text;

}
