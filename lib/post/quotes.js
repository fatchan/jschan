'use strict';

const Posts = require(__dirname+'/../../db/posts.js')
	, Boards = require(__dirname+'/../../db/boards.js')
	, quoteRegex = /&gt;&gt;(?<quotenum>\d+)/g
	, crossQuoteRegex = /&gt;&gt;&gt;&#x2F;(?<board>\w+)(?:&#x2F;(?<quotenum>\d*))?/gm
	, catalogSearchQuoteRegex = /&gt;&gt;&gt;#&#x2F;(?<search>\w+)&#x2F;/gm;

module.exports = {

	quoteRegex, crossQuoteRegex, catalogSearchQuoteRegex,

	process: async (board, text, thread) => {

		//get the matches
		const quotes = text.match(quoteRegex);
		const crossQuotes = text.match(crossQuoteRegex);
		const catalogSearchQuotes = text.match(catalogSearchQuoteRegex);
		if (!quotes && !crossQuotes && !catalogSearchQuotes) {
			return { quotedMessage: text, threadQuotes: [], crossQuotes: [] };
		}

		//make query for db including crossquotes
		const postQueryOrs = [];
		const boardQueryIns = [];
		const crossQuoteMap = {};
		if (quotes && board) {
			const quoteIds = [...new Set(quotes.map(q => { return Number(q.substring(8)); }))];
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
				if (!crossQuoteMap[crossQuoteBoard]) {
					crossQuoteMap[crossQuoteBoard] = [];
				}
				if (!isNaN(crossQuotePostId) && crossQuotePostId > 0) {
					crossQuoteMap[crossQuoteBoard].push(crossQuotePostId);
				}
			}
			const crossQuoteBoards = Object.keys(crossQuoteMap);
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
		if (crossQuotes || quotes) {
			const [ posts, boards ] = await Promise.all([
				postQueryOrs.length > 0 ? Posts.getPostsForQuotes(postQueryOrs) : [],
				boardQueryIns.length > 0 ? Boards.db.find({ '_id': { '$in': boardQueryIns } }, { projection: { '_id': 1 } }).toArray() : []
			]);

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
		}

		//then replace the quotes with only ones that exist
		const threadQuotes = new Set();
		const nonThreadQuotes = new Set();
		if (quotes) {
			text = text.replace(quoteRegex, (match, quotenum) => {
				if (postThreadIdMap[board] && postThreadIdMap[board][quotenum]) {
					if (postThreadIdMap[board][quotenum].thread === thread) {
						threadQuotes.add(postThreadIdMap[board][quotenum]);
					} else {
						nonThreadQuotes.add(postThreadIdMap[board][quotenum]);
					}
					return `<a class='quote' href='/${board}/thread/${postThreadIdMap[board][quotenum].thread}.html#${quotenum}'>&gt;&gt;${quotenum}</a>${postThreadIdMap[board][quotenum].postId == thread ? ' <small>(OP)</small> ' : ''}`;
				}
				return `<span class='invalid-quote'>&gt;&gt;${quotenum}</span>`;
			});
		}
		if (crossQuotes) {
			text = text.replace(crossQuoteRegex, (match, quoteboard, quotenum) => {
				if (postThreadIdMap[quoteboard]) {
					if (!quotenum) {
						return `<a class='quote' href='/${quoteboard}/index.html'>&gt;&gt;&gt;/${quoteboard}/</a>`;
					} else if (!isNaN(quotenum) && quotenum > 0 && postThreadIdMap[quoteboard][quotenum]) {
						return `<a class='quote' href='/${quoteboard}/thread/${postThreadIdMap[quoteboard][quotenum].thread}.html#${quotenum}'>&gt;&gt;&gt;/${quoteboard}/${quotenum}</a>`;
					}
				}
				return `<span class='invalid-quote'>&gt;&gt;&gt;/${quoteboard}/${quotenum || ''}</span>`;
			});
		}
		if (catalogSearchQuotes) {
			text = text.replace(catalogSearchQuoteRegex, (match, search) => {
				return `<a href='/${board}/catalog.html#${board}-/${search}/'>&gt;&gt;&gt;#/${search}/</a>`;
			});
		}

		return { quotedMessage: text, threadQuotes: [...threadQuotes], crossQuotes: [...nonThreadQuotes] };

	},

};
