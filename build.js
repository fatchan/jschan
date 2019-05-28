'use strict';

const Posts = require(__dirname+'/db/posts.js')
	, Boards = require(__dirname+'/db/boards.js')
	, uploadDirectory = require(__dirname+'/helpers/uploadDirectory.js')
	, render = require(__dirname+'/helpers/render.js');

module.exports = {

	buildCatalog: async (board) => {
//console.log('building catalog', `${board._id}/catalog.html`);
		if (!board._id) {
			board = await Boards.findOne(board);
		}
		const threads = await Posts.getCatalog(board._id);
		return render(`${board._id}/catalog.html`, 'catalog.pug', {
			board,
			threads
		});
	},

	buildThread: async (threadId, board) => {
//console.log('building thread', `${board._id || board}/thread/${threadId}.html`);
		if (!board._id) {
			board = await Boards.findOne(board);
		}
		const thread = await Posts.getThread(board._id, threadId)
		if (!thread) {
			return; //this thread may have been an OP that was deleted
		}

	/*
		temporary, jsut seeing how well this works
	*/
		const postMap = new Map()
		postMap.set(thread.postId, thread)
		for (let i = 0; i < thread.replies.length; i++) {
			const reply = thread.replies[i];
			postMap.set(reply.postId, reply);
		}
		for (let i = 0; i < thread.replies.length; i++) {
			const reply = thread.replies[i];
			if (!reply.quotes) continue;
			for (let j = 0; j < reply.quotes.length; j++) {
				const quote = reply.quotes[j];
				if (postMap.has(quote)) {
					const post = postMap.get(quote)
					if (!post.backlinks) {
						post.backlinks = [];
					}
					post.backlinks.push(reply.postId);
				}
			}
		}
	/*
		temporary, jsut seeing how well this works
	*/

		return render(`${board._id}/thread/${threadId}.html`, 'thread.pug', {
			board,
			thread
		});
	},

	buildBoard: async (board, page, maxPage=null) => {
//console.log('building board page', `${board._id}/${page === 1 ? 'index' : page}.html`);
		const threads = await Posts.getRecent(board._id, page);
		if (!maxPage) {
			maxPage = Math.ceil((await Posts.getPages(board._id)) / 10);
		}
	/*
		temporary, jsut seeing how well this works
	*/
		for (let k = 0; k < threads.length; k++) {
			const thread = threads[k];
			const postMap = new Map()
			postMap.set(thread.postId, thread)
			for (let i = 0; i < thread.replies.length; i++) {
				const reply = thread.replies[i];
				postMap.set(reply.postId, reply);
			}
			for (let i = 0; i < thread.replies.length; i++) {
				const reply = thread.replies[i];
				if (!reply.quotes) continue;
				for (let j = 0; j < reply.quotes.length; j++) {
					const quote = reply.quotes[j];
					if (postMap.has(quote)) {
						const post = postMap.get(quote)
						if (!post.backlinks) {
							post.backlinks = [];
						}
						post.backlinks.push(reply.postId);
					}
				}
			}
		}
	/*
		temporary, jsut seeing how well this works
	*/
		return render(`${board._id}/${page === 1 ? 'index' : page}.html`, 'board.pug', {
			board,
			threads,
			maxPage,
			page
		});
	},

	//building multiple pages (for rebuilds)
	buildBoardMultiple: async (board, startpage=1, endpage=10) => {
		const maxPage = Math.ceil((await Posts.getPages(board._id)) / 10);
		if (endpage === 0) {
			//deleted only/all posts, so only 1 page will remain
			endpage = 1;
		} else if (maxPage < endpage) {
			//else just build up to the max page if it is greater than input page number
			endpage = maxPage
		}
		const difference = endpage-startpage + 1; //+1 because for single pagemust be > 0
		const threads = await Posts.getRecent(board._id, startpage, difference*10);
	/*
		temporary, jsut seeing how well this works
	*/
		for (let k = 0; k < threads.length; k++) {
			const thread = threads[k];
			const postMap = new Map()
			postMap.set(thread.postId, thread)
			for (let i = 0; i < thread.replies.length; i++) {
				const reply = thread.replies[i];
				postMap.set(reply.postId, reply);
			}
			for (let i = 0; i < thread.replies.length; i++) {
				const reply = thread.replies[i];
				if (!reply.quotes) continue;
				for (let j = 0; j < reply.quotes.length; j++) {
					const quote = reply.quotes[j];
					if (postMap.has(quote)) {
						const post = postMap.get(quote)
						if (!post.backlinks) {
							post.backlinks = [];
						}
						post.backlinks.push(reply.postId);
					}
				}
			}
		}
	/*
		temporary, jsut seeing how well this works
	*/
		const buildArray = [];
		for (let i = startpage; i <= endpage; i++) {
//console.log('multi building board page', `${board._id}/${i === 1 ? 'index' : i}.html`);
			let spliceStart = (i-1)*10;
			if (spliceStart > 0) {
				spliceStart = spliceStart - 1;
			}
			buildArray.push(
				render(`${board._id}/${i === 1 ? 'index' : i}.html`, 'board.pug', {
					board,
					threads: threads.splice(0,10),
					maxPage,
					page: i,
				})
			);
		}
		return Promise.all(buildArray);
	},

	buildHomepage: async () => {
		const boards = await Boards.find();
		return render('index.html', 'home.pug', {
			boards
		});
	},

	buildChangePassword: () => {
		return render('changepassword.html', 'changepassword.pug');
	},

	buildLogin: () => {
		return render('login.html', 'login.pug');
	},

	buildRegister: () => {
		return render('register.html', 'register.pug');
	},

}
