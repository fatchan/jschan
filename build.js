'use strict';

const Posts = require(__dirname+'/db/posts.js')
	, Boards = require(__dirname+'/db/boards.js')
	, uploadDirectory = require(__dirname+'/helpers/uploadDirectory.js')
	, render = require(__dirname+'/helpers/render.js');

module.exports = {

	buildCatalog: async (board) => {
		const threads = await Posts.getCatalog(board._id);
		return render(`${board._id}/catalog.html`, 'catalog.pug', {
			board,
			threads
		});
	},

	buildThread: async (threadId, board) => {
//console.log('building thread', `${board._id}/thread/${threadId}.html`);
		if (!board._id) {
			board = await Boards.findOne(board);
		}
		const thread = await Posts.getThread(board._id, threadId)
		if (!thread) {
			return; //this thread may have been an OP that was deleted during a rebuild
		}
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
		endpage = maxPage < endpage ? maxPage : endpage;
		const difference = endpage-startpage + 1; //+1 because for single pagemust be > 0
		const threads = await Posts.getRecent(board._id, startpage, difference*10);
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
