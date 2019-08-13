'use strict';

const Posts = require(__dirname+'/../../db/posts.js')
	, Boards = require(__dirname+'/../../db/boards.js')
	, quoteRegex = /&gt;&gt;(?<quotenum>\d+)/g
	, crossQuoteRegex = /&gt;&gt;&gt;&#x2F;(?<board>\w+)(?:&#x2F;(?<quotenum>\d*))?/gm;

module.exports = async (board, text, thread) => {

	//get the matches
	const quotes = text.match(quoteRegex);
	const crossQuotes = text.match(crossQuoteRegex);
	if (!quotes && !crossQuotes) {
		return { quotedMessage: text, threadQuotes: [] };
	}

	//make query for db including crossquotes
	const postQueryOrs = []
	const boardQueryIns = []
	const crossQuoteMap = {};
	if (quotes && board) {
		const quoteIds = [...new Set(quotes.map(q => { return Number(q.substring(8)) }))];
		postQueryOrs.push({
			'board': board,
			'postId': {
				'$in': quoteIds
			}
		});
	}

	if (crossQuotes) {
		for (let i = 0; i < crossQuotes.length; i++) {
			const crossQuote = crossQuotes[i].split('&#x2F;');
			const crossQuoteBoard = crossQuote[1];
			const crossQuotePostId = +crossQuote[2];
			if (crossQuoteBoard === board) {
				continue;
			}
			if (!crossQuoteMap[crossQuoteBoard]) {
				crossQuoteMap[crossQuoteBoard] = [];
			}
			if (!isNaN(crossQuotePostId) && crossQuotePostId > 0) {
				crossQuoteMap[crossQuoteBoard].push(crossQuotePostId);
			}
		}
		const crossQuoteBoards = Object.keys(crossQuoteMap)
		for (let i = 0; i < crossQuoteBoards.length; i++) {
			const crossQuoteBoard = crossQuoteBoards[i];
			boardQueryIns.push(crossQuoteBoard);
			const crossQuoteBoardPostIds = crossQuoteMap[crossQuoteBoard];
			if (crossQuoteBoardPostIds.length > 0) {
				postQueryOrs.push({
					'board': crossQuoteBoard,
					'postId': {
						'$in': crossQuoteBoardPostIds
					}
				});
			}
		}
	}

	//get all the posts from quotes
	const postThreadIdMap = {};
	const [ posts, boards ] = await Promise.all([
		postQueryOrs.length > 0 ? Posts.getPostsForQuotes(postQueryOrs) : [],
		boardQueryIns.length > 0 ? Boards.db.find({ '_id': { '$in': boardQueryIns } }, { projection: { '_id': 1 } }).toArray() : []
	]);
	//if none of the quotes were real, dont do a replace
	if (posts.length === 0 && boards.length === 0) {
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
	for (let i = 0; i < boards.length; i++) {
		const boardName = boards[i]._id;
		if (!postThreadIdMap[boardName]) {
			postThreadIdMap[boardName] = {};
		}
	}

	//then replace the quotes with only ones that exist
	const threadQuotes = new Set();
	if (quotes && Object.keys(postThreadIdMap).length > 0) {
		text = text.replace(quoteRegex, (match, quotenum) => {
			if (postThreadIdMap[board] && postThreadIdMap[board][quotenum]) {
				if (!threadQuotes.has(postThreadIdMap[board][quotenum]) && postThreadIdMap[board][quotenum].thread === thread) {
					threadQuotes.add(postThreadIdMap[board][quotenum]);
				}
				return `<a class='quote' href='/${board}/thread/${postThreadIdMap[board][quotenum].thread}.html#${quotenum}'>&gt;&gt;${quotenum}</a>${postThreadIdMap[board][quotenum].postId == thread ? ' <small>(OP)</small> ' : ''}`;
			}
			return match;
		});
	}
	if (crossQuotes) {
		text = text.replace(crossQuoteRegex, (match, quoteboard, quotenum) => {
			if (postThreadIdMap[quoteboard]) {
				if (!isNaN(quotenum) && quotenum > 0 && postThreadIdMap[quoteboard][quotenum]) {
					return `<a class='quote' href='/${quoteboard}/thread/${postThreadIdMap[quoteboard][quotenum].thread}.html#${quotenum}'>&gt;&gt;&gt;/${quoteboard}/${quotenum}</a>`;
				} else {
					return `<a class='quote' href='/${quoteboard}/index.html'>&gt;&gt;&gt;/${quoteboard}/</a>`;
				}
			}
			return match;
		});
	}

	return { quotedMessage: text, threadQuotes: [...threadQuotes] };

}
