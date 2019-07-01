'use strict';

const Posts = require(__dirname+'/../../db/posts.js')
	, Boards = require(__dirname+'/../../db/boards.js')
	, quoteRegex = />>\d+/g
	, crossQuoteRegex = />>>\/\w+\/\d*$/gm;

module.exports = async (board, text, thread) => {

	//get the matches
	const quotes = text.match(quoteRegex);
	const crossQuotes = text.match(crossQuoteRegex);
	if (!quotes && !crossQuotes) {
		return { quotedMessage: text, threadQuotes: [] };
	}

	//make query for db including crossquotes
	const queryOrs = []
	const crossQuoteMap = {};
	if (quotes) {
		const quoteIds = [...new Set(quotes.map(q => +q.substring(2)))]; //only uniques
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
	const postThreadIdMap = {};
	if (queryOrs.length > 0) {
		const posts = await Posts.getPostsForQuotes(queryOrs);
		//if none of the quotes were real, dont do a replace
		if (posts.length === 0) {
			return { quotedMessage: text, threadQuotes: [] };
		}
		//turn the result into a map of postId => threadId/postId
		for (let i = 0; i < posts.length; i++) {
			const post = posts[i];
			if (!postThreadIdMap[post.board]) {
				postThreadIdMap[post.board] = {};
			}
			postThreadIdMap[post.board][post.postId] = {
				'_id': post._id,
				'thread': post.thread || post.postId,
				'postId': post.postId
			};
		}
	}

	//then replace the quotes with only ones that exist
	const addedQuotes = new Set();
	const threadQuotes = [];
	if (quotes && Object.keys(postThreadIdMap).length > 0) {
		text = text.replace(quoteRegex, (match) => {
			const quotenum = +match.substring(2);
			if (postThreadIdMap[board] && postThreadIdMap[board][quotenum]) {
				if (!addedQuotes.has(postThreadIdMap[board][quotenum]._id) && postThreadIdMap[board][quotenum].thread === thread) {
					threadQuotes.push(postThreadIdMap[board][quotenum]);
					addedQuotes.add(postThreadIdMap[board][quotenum]._id);
				}
				return `<a class='quote' href='/${board}/thread/${postThreadIdMap[board][quotenum].thread}.html#${quotenum}'>&gt;&gt;${quotenum}</a>${postThreadIdMap[board][quotenum].postId == thread ? ' <small>(OP)</small> ' : ''}`;
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
				return `<a class='quote' href='/${quoteboard}/thread/${postThreadIdMap[quoteboard][quotenum].thread}.html#${quotenum}'>&gt;&gt;&gt;/${quoteboard}/${quotenum}</a>`;
			} else if (!quote[2]) {
				return `<a class='quote' href='/${quoteboard}/index.html'>&gt;&gt;&gt;/${quoteboard}/</a>`;
			}
			return match;
		});
	}

	return { quotedMessage: text, threadQuotes };

}
