'use strict';

const Mongo = require(__dirname+'/../db/db.js')
	, msTime = require(__dirname+'/mstime.js')
	, Posts = require(__dirname+'/../db/posts.js')
	, Files = require(__dirname+'/../db/files.js')
	, Boards = require(__dirname+'/../db/boards.js')
	, formatSize = require(__dirname+'/files/formatsize.js')
	, uploadDirectory = require(__dirname+'/files/uploadDirectory.js')
	, render = require(__dirname+'/render.js');

module.exports = {

	buildBanners: async(board) => {
		const buildName = `Building: ${board._id}/banners.html`;
		console.time(buildName);
		await render(`${board._id}/banners.html`, 'banners.pug', {
			board: board,
		});
		console.timeEnd(buildName);
	},

	buildCatalog: async (board) => {
		const buildName = `Building: ${board._id}/catalog.html`;
		console.time(buildName);
		if (!board._id) {
			board = await Boards.findOne(board);
		}
		const threads = await Posts.getCatalog(board._id);
		await render(`${board._id}/catalog.html`, 'catalog.pug', {
			board,
			threads,
		});
		console.timeEnd(buildName);
	},

	buildThread: async (threadId, board) => {
		const buildName = `Building: ${board._id || board}/thread/${threadId}.html`;
		console.time(buildName);
		if (!board._id) {
			board = await Boards.findOne(board);
		}
		const thread = await Posts.getThread(board._id, threadId)
		if (!thread) {
			console.timeEnd(buildName, 'deleted OP')
			return; //this thread may have been an OP that was deleted
		}
		await render(`${board._id}/thread/${threadId}.html`, 'thread.pug', {
			board,
			thread,
		});
		console.timeEnd(buildName);
	},

	buildBoard: async (board, page, maxPage=null) => {
		const buildName = `Building: ${board._id || board}/${page === 1 ? 'index' : page}.html`;
		console.time(buildName);
		const threads = await Posts.getRecent(board._id, page);
		if (maxPage == null) {
			maxPage = Math.min(Math.ceil((await Posts.getPages(board._id)) / 10), Math.ceil(board.settings.threadLimit/10));
		}

		await render(`${board._id}/${page === 1 ? 'index' : page}.html`, 'board.pug', {
			board,
			threads,
			maxPage,
			page,
		});
		console.timeEnd(buildName);
	},

	//building multiple pages (for rebuilds)
	buildBoardMultiple: async (board, startpage=1, endpage) => {
		const buildName = 'multi page build';
		console.time(buildName);
		const maxPage = Math.min(Math.ceil((await Posts.getPages(board._id)) / 10), Math.ceil(board.settings.threadLimit/10));
		if (endpage === 0) {
			//deleted only/all posts, so only 1 page will remain
			endpage = 1;
		} else if (maxPage < endpage) {
			//else just build up to the max page if it is greater than input page number
			endpage = maxPage
		}
		const difference = endpage-startpage + 1; //+1 because for single pagemust be > 0
		const threads = await Posts.getRecent(board._id, startpage, difference*10);
		console.timeLog(buildName, `${board._id}/ ${startpage === 1 ? 'index' : startpage} -> ${endpage === 1 ? 'index' : endpage} .html`);
		const buildArray = [];
		for (let i = startpage; i <= endpage; i++) {
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
		await Promise.all(buildArray);
		console.timeEnd(buildName);
	},

	buildHomepage: async () => {
		const buildName = `Building: index.html`;
		console.time(buildName);
		//getting boards
		const boards = await Boards.find();
		//geting PPH for each board
		const pastHour = Math.floor((Date.now() - msTime.hour)/1000);
		const pastHourObjectId = Mongo.ObjectId.createFromTime(pastHour);
		const pph = await Posts.db.aggregate([
			{
				'$match': {
					'_id': {
						'$gt': pastHourObjectId
					}
				}
			},
			{
				'$group': {
					'_id': '$board',
					'pph': { '$sum': 1 },
				}
			},
		]).toArray().then(res => {
			return res.reduce((acc, item) => {
				acc[item._id] = item.pph;
				return acc;
			}, {});
		});
		for (let i = 0; i < boards.length; i++) {
			const board = boards[i];
			board.pph = pph[board._id] || 0;
		}
		//getting file stats
		const fileStats = await Files.db.aggregate([
			{
				'$group': {
					'_id': null,
					//could add other interesting mongo aggregate stuff here like averages
					'count': { '$sum': 1 },
					'size': { '$sum': '$size' }
				}
			}
		]).toArray().then(res => {
			const stats = res[0];
			return {
				count: stats.count,
				totalSize: stats.size,
				totalSizeString: formatSize(stats.size)
			}
		});
		await render('index.html', 'home.pug', {
			boards,
			fileStats,
		});
		console.timeEnd(buildName);
	},

	buildChangePassword: () => {
		return render('changepassword.html', 'changepassword.pug');
	},

	buildRegister: () => {
		return render('register.html', 'register.pug');
	},

	buildCaptcha: () => {
		return render('captcha.html', 'captcha.pug');
	},

}
