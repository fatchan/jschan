'use strict';

const Mongo = require(__dirname+'/../db/db.js')
	, cache = require(__dirname+'/../redis.js')
	, timeUtils = require(__dirname+'/timeutils.js')
	, uploadDirectory = require(__dirname+'/files/uploadDirectory.js')
	, { remove } = require('fs-extra')
	, { debugLogs, pruneModlogs, pruneAfterDays, enableWebring } = require(__dirname+'/../configs/main.js')
	, { Stats, Posts, Files, Boards, News, Modlogs } = require(__dirname+'/../db/')
	, render = require(__dirname+'/render.js')
	, timeDiffString = require(__dirname+'/timediffstring.js');

module.exports = {

	buildBanners: async (options) => {
		const label = `/${options.board._id}/banners.html`;
		const start = process.hrtime();
		const html = await render(label, 'banners.pug', options, {
			'name': `/${options.board._id}/banners.json`,
			'data': options.board.banners
		});
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
		return html;
	},

	buildCatalog: async (options) => {
		const label = `/${options.board._id || options.board}/catalog.html`;
		const start = process.hrtime();
		if (!options.board._id) {
			options.board = await Boards.findOne(options.board);
		}
		const threads = await Posts.getCatalog(options.board._id);
		const html = await render(label, 'catalog.pug', {
			...options,
			threads,
		}, {
			'name': `/${options.board._id}/catalog.json`,
			'data': threads
		});
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
		return html;
	},

	buildThread: async (options) => {
		const label = `/${options.board._id || options.board}/thread/${options.threadId}.html`;
		const start = process.hrtime();
		if (!options.board._id) {
			options.board = await Boards.findOne(options.board);
		}
		const thread = await Posts.getThread(options.board._id, options.threadId);
		if (!thread) {
			return; //this thread may have been an OP that was deleted
		}
		const html = await render(label, 'thread.pug', {
			...options,
			thread,
		}, {
			'name': `/${options.board._id}/thread/${options.threadId}.json`,
			'data': thread
		});
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
		return html;
	},

	buildBoard: async (options) => {
		const label = `/${options.board._id}/${options.page === 1 ? 'index' : options.page}.html`;
		const start = process.hrtime();
		const threads = await Posts.getRecent(options.board._id, options.page);
		if (!options.maxPage) {
			options.maxPage = Math.min(Math.ceil((await Posts.getPages(options.board._id)) / 10), Math.ceil(options.board.settings.threadLimit/10));
		}
		const html = await render(label, 'board.pug', {
			...options,
			threads,
		}, {
			'name': `/${options.board._id}/${options.page === 1 ? 'index' : options.page}.json`,
			'data': threads
		});
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
		return html;
	},

	//building multiple pages (for rebuilds)
	buildBoardMultiple: async (options) => {
		const start = process.hrtime();
		const maxPage = Math.min(Math.ceil((await Posts.getPages(options.board._id)) / 10), Math.ceil(options.board.settings.threadLimit/10)) || 1;
		if (options.endpage === 0) {
			//deleted only/all posts, so only 1 page will remain
			options.endpage = 1;
		} else if (maxPage < options.endpage || !options.endpage) {
			//else just build up to the max page if it is greater than input page number
			options.endpage = maxPage
		}
		const difference = options.endpage-options.startpage + 1; //+1 because for single pagemust be > 0
		const threads = await Posts.getRecent(options.board._id, options.startpage, difference*10);
		const label = `/${options.board._id}/${options.startpage === 1 ? 'index' : options.startpage}${options.endpage === options.startpage ? '' : '->'+(options.endpage === 1 ? 'index' : options.endpage)}.html`;
		const buildArray = [];
		for (let i = options.startpage; i <= options.endpage; i++) {
			let spliceStart = (i-1)*10;
			if (spliceStart > 0) {
				spliceStart = spliceStart - 1;
			}
			const pageThreads = threads.splice(0,10);
			buildArray.push(
				render(`${options.board._id}/${i === 1 ? 'index' : i}.html`, 'board.pug', {
					board: options.board,
					threads: pageThreads,
					maxPage,
					page: i,
				}, {
					'name': `/${options.board._id}/${i === 1 ? 'index' : i}.json`,
					'data': pageThreads
				})
			);
		}
		await Promise.all(buildArray);
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
	},

	buildNews: async () => {
		const label = '/news.html';
		const start = process.hrtime();
		const news = await News.find();
		const html = await render('news.html', 'news.pug', {
			news
		});
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
		return html;
	},

	buildModLog: async (options) => {
		if (!options.startDate || !options.endDate) {
			options.startDate = new Date(); //this is being built by action handler so will always be current date
			options.endDate = new Date(options.startDate.getTime());
			options.startDate.setHours(0,0,0,0);
			options.endDate.setHours(23,59,59,999);
		}
		const day = ('0'+options.startDate.getDate()).slice(-2);
		const month = ('0'+(options.startDate.getMonth()+1)).slice(-2);
		const year = options.startDate.getFullYear();
		const label = `/${options.board._id}/logs/${month}-${day}-${year}.html`;
		const start = process.hrtime();
		if (!options.logs) {
			options.logs = await Modlogs.findBetweenDate(options.board, options.startDate, options.endDate);
		}
		const html = await render(label, 'modlog.pug', {
			...options
		});
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
		return html;
	},

	buildModLogList: async (options) => {
		const label = `/${options.board._id}/logs.html`;
		const start = process.hrtime();
		let dates = await Modlogs.getDates(options.board);
		if (pruneModlogs === true) {
			const pruneLogs = [];
			const pruneAfter = new Date(Date.now()-timeUtils.DAY*pruneAfterDays);
			dates = dates.filter(date => {
console.log(date, pruneAfter)
				const { year, month, day } = date.date;
				if (new Date(year, month-1, day) > pruneAfter) { //-1 for 0-index months
					return true;
				}
				pruneLogs.push(`${month}-${day}-${year}`);
				return false;
			});
			if (pruneLogs.length > 0) {
				await Promise.all(pruneLogs.map(log => {
					remove(`${uploadDirectory}/html/${options.board._id}/logs/${log}.html`)
				}));
				await Modlogs.deleteOld(options.board, pruneAfter);
			}
		}
		const html = await render(label, 'modloglist.pug', {
			board: options.board,
			dates
		});
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
		return html;
	},

	buildHomepage: async () => {
		const label = '/index.html';
		const start = process.hrtime();
		let [ totalStats, boards, fileStats ] = await Promise.all([
			Boards.totalStats(), //overall total posts ever made
			Boards.boardSort(0, 20), //top 20 boards sorted by users, pph, total posts
			Files.activeContent() //size ans number of files
		]);
		const html = await render('index.html', 'home.pug', {
			totalStats,
			boards,
			fileStats,
		});
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
		return html;
	},

	updateStats: async () => {
		const label = 'Hourly stats rollover';
		const start = process.hrtime();
		await Stats.updateBoards();
		await Stats.resetStats();
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
		module.exports.buildHomepage();
	},

	buildChangePassword: () => {
		return render('changepassword.html', 'changepassword.pug');
	},

	buildRegister: () => {
		return render('register.html', 'register.pug');
	},

	buildCreate: () => {
		return render('create.html', 'create.pug');
	},

	buildCaptcha: () => {
		return render('captcha.html', 'captcha.pug');
	},

}
