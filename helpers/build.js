'use strict';

const Mongo = require(__dirname+'/../db/db.js')
	, msTime = require(__dirname+'/mstime.js')
	, dateArray = require(__dirname+'/datearray.js')
	, { Posts, Files, Boards, News, Modlogs } = require(__dirname+'/../db/')
	, render = require(__dirname+'/render.js');

module.exports = {

	buildBanners: async(board) => {
		const label = `${board._id}/banners.html`;
		console.time(label);
		await render(label, 'banners.pug', {
			board: board,
		});
		console.timeEnd(label);
	},

	buildCatalog: async (board) => {
		const label = `${board._id || board}/catalog.html`;
		console.time(label);
		if (!board._id) {
			board = await Boards.findOne(board);
		}
		const threads = await Posts.getCatalog(board._id);
		await render(label, 'catalog.pug', {
			board,
			threads,
		});
		console.timeEnd(label);
	},

	buildThread: async (threadId, board) => {
		const label = `${board._id || board}/thread/${threadId}.html`;
		console.time(label);
		if (!board._id) {
			board = await Boards.findOne(board);
		}
		const thread = await Posts.getThread(board._id, threadId)
		if (!thread) {
			return; //this thread may have been an OP that was deleted
		}
		await render(label, 'thread.pug', {
			board,
			thread,
		});
		console.timeEnd(label);
	},

	buildBoard: async (board, page, maxPage=null) => {
		const label = `${board._id}/${page === 1 ? 'index' : page}.html`;
		console.time(label);
		const threads = await Posts.getRecent(board._id, page);
		if (maxPage == null) {
			maxPage = Math.min(Math.ceil((await Posts.getPages(board._id)) / 10), Math.ceil(board.settings.threadLimit/10));
		}

		await render(label, 'board.pug', {
			board,
			threads,
			maxPage,
			page,
		});
		console.timeEnd(label);
	},

	//building multiple pages (for rebuilds)
	buildBoardMultiple: async (board, startpage=1, endpage) => {
		const label = 'multiple';
		console.time(label);
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
		console.timeLog(label, `${board._id}/${startpage === 1 ? 'index' : startpage}.html => ${board._id}/${endpage === 1 ? 'index' : endpage}.html`)
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
		console.timeEnd(label);
	},

	buildNews: async () => {
		const label = '/news.html';
		console.time(label);
		const news = await News.find();
		await render('news.html', 'news.pug', {
			news
		});
		console.timeEnd(label);
	},

	buildModLog: async (board, startDate, endDate, logs) => {
		if (!startDate || !endDate) {
			startDate = new Date(); //this is being built by action handler so will always be current date
			endDate = new Date(startDate.getTime());
			startDate.setHours(0,0,0,0);
			endDate.setHours(23,59,59,999);
		}
		const day = ('0'+startDate.getDate()).slice(-2);
		const month = ('0'+(startDate.getMonth()+1)).slice(-2);
		const year = startDate.getFullYear();
		const label = `/${board._id}/logs/${month}-${day}-${year}.html`;
		console.time(label);
		if (!logs) {
			logs = await Modlogs.findBetweenDate(board, startDate, endDate);
		}
		await render(label, 'modlog.pug', {
			board,
			logs,
			startDate,
			endDate
		});
		console.timeEnd(label);
	},

	buildModLogList: async (board) => {
		const label = `/${board._id}/logs.html`;
		console.time(label);
		let dates = []
		const [ firstLog, lastLog ] = await Promise.all([
			Modlogs.getFirst(board),
			Modlogs.getLast(board)
		]);
		if (firstLog.length > 0 && lastLog.length > 0) {
			const firstLogDate = firstLog[0].date;
   			firstLogDate.setHours(1,0,0,0);
			const lastLogDate = lastLog[0].date;
			dates = dateArray(firstLogDate, lastLogDate);
		}
		await render(label, 'modloglist.pug', {
			board,
			dates
		});
		console.timeEnd(label);
	},

	buildHomepage: async () => {
		const label = '/index.html';
		console.time(label);
		const [ activeUsers, postsPerHour ] = await Promise.all([
			Posts.activeUsers(),
			Posts.postsPerHour()
		]);
		for (let i = 0; i < activeUsers.boardActiveUsers.length; i++) {
			const userboard = activeUsers.boardActiveUsers[i];
			const pphboard = postsPerHour.find(b => b._id === userboard._id);
			if (pphboard != null) {
				userboard.pph = pphboard.pph;
			}
		}
		const bulkWrites = [];
		const updatedBoards = [];
		for (let i = 0; i < activeUsers.boardActiveUsers.length; i++) {
			const data = activeUsers.boardActiveUsers[i];
			updatedBoards.push(data._id);
			//boards with pph get pph set
			bulkWrites.push({
				'updateOne': {
					'filter': {
						'_id': data._id
					},
					'update': {
						'$set': {
							'pph': data.pph != null ? data.pph : 0,
							'ips': data.ips
						}
					}
				}
			})
		}
		//boards with no pph get set to 0
		bulkWrites.push({
			'updateMany': {
				'filter': {
					'_id': {
						'$nin': updatedBoards
					}
				},
				'update': {
					'$set': {
						'pph': 0,
						'ips': 0
					}
				}
			}
		});
		const totalActiveUsers = activeUsers.totalActiveUsers[0].ips;
		await Boards.db.bulkWrite(bulkWrites);
		const [ totalPosts, boards, fileStats ] = await Promise.all([
			Boards.totalPosts(), //overall total posts ever made
			Boards.frontPageSortLimit(), //boards sorted by users, pph, total posts
			Files.activeContent() //size of all files
		]);
		await render('index.html', 'home.pug', {
			totalPosts: totalPosts,
			totalActiveUsers,
			boards,
			fileStats,
		});
		console.timeEnd(label);
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
