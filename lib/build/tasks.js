'use strict';

const timeUtils = require(__dirname+'/../converter/timeutils.js')
	, uploadDirectory = require(__dirname+'/../file/uploaddirectory.js')
	, { remove } = require('fs-extra')
	, config = require(__dirname+'/../misc/config.js')
	, { debugLogs } = require(__dirname+'/../../configs/secrets.js')
	, { CustomPages, Stats, Posts, Files, Boards, News, Modlogs } = require(__dirname+'/../../db/')
	, cache = require(__dirname+'/../redis/redis.js')
	, render = require(__dirname+'/../build/render.js')
	, buildQueue = require(__dirname+'/../build/queue.js')
	, gulp = require('gulp')
	, { buildTasks } = require(__dirname+'/../../gulpfile.js')
	, { timeDiffString } = require(__dirname+'/../converter/timeutils.js');

module.exports = {

	gulp: async (options) => {
		const label = `running gulp tasks [${options.tasks.join(', ')}] after global config change`;
		const start = process.hrtime();
		gulp.series(options.tasks.map(t => buildTasks[t]), () => {
			const end = process.hrtime(start);
			debugLogs && console.log(timeDiffString(label, end));
		})();
	},

	buildBanners: async (options) => {
		const label = `/${options.board._id}/banners.html`;
		const start = process.hrtime();
		options.managePage = 'assets.html';
		const { html, json } = await render(label, 'banners.pug', options, {
			'name': `/${options.board._id}/banners.json`,
			'data': options.board.banners
		});
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
		return { html, json };
	},

	buildBoardSettings: async (options) => {
		const label = `/${options.board._id}/settings.json`;
		const start = process.hrtime();
		const customPages = await CustomPages.find(options.board._id);
		const bs = options.board.settings;
		const projectedSettings = {
			customPages: customPages.map(p => p.page), //list of custompage names
			announcement: bs.announcement,
			allowedFileTypes: bs.allowedFileTypes,
			maxFiles: bs.maxFiles,
			captchaMode: bs.captchaMode,
			forceAnon: bs.forceAnon,
			sageOnlyEmail: bs.sageOnlyEmail,
			customFlags: bs.customFlags,
			forceThreadMessage: bs.forceThreadMessage,
			forceThreadFile: bs.forceThreadFile,
			forceThreadSubject: bs.forceThreadSubject,
			disableReplySubject: bs.disableReplySubject,
			minThreadMessageLength: bs.minThreadMessageLength,
			minReplyMessageLength: bs.minReplyMessageLength,
			maxThreadMessageLength: bs.maxThreadMessageLength,
			maxReplyMessageLength: bs.maxReplyMessageLength,
			defaultName: bs.defaultName,
			language: bs.language,
		};
		const { json } = await render(null, null, null, {
			'name': `/${options.board._id}/settings.json`,
			'data': projectedSettings
		});
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
		return json;
	},

	buildGlobalSettings: async () => {
		const label = '/settings.json';
		const start = process.hrtime();
		const { captchaOptions: co, language } = config.get;
		const projectedSettings = {
			captchaOptions: {
				language: language,
				type: co.type,
				grid: {
					size: co.grid.size,
					question: co.grid.question,
				}
			}
		};
		const { json } = await render(null, null, null, {
			name: '/settings.json',
			data: projectedSettings
		});
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
		return json;
	},

	buildCatalog: async (options) => {
		const label = `/${options.board._id || options.board}/catalog.html`;
		const start = process.hrtime();
		if (!options.board._id) {
			options.board = await Boards.findOne(options.board);
		}
		options.managePage = 'catalog.html';
		const threads = await Posts.getCatalog(options.board._id);
		const { html, json } = await render(label, 'catalog.pug', {
			...options,
			threads,
		}, {
			'name': `/${options.board._id}/catalog.json`,
			'data': threads
		});
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
		return { html, json };
	},

	buildThread: async (options) => {
		const label = `/${options.board._id || options.board}/thread/${options.threadId}.html`;
		const start = process.hrtime();
		if (!options.board._id) {
			options.board = await Boards.findOne(options.board);
		}
		options.managePage = `thread/${options.threadId}.html`;
		const thread = await Posts.getThread(options.board._id, options.threadId);
		if (!thread) {
			return; //this thread may have been an OP that was deleted
		}
		const { html, json } = await render(label, 'thread.pug', {
			...options,
			thread,
		}, {
			'name': `/${options.board._id}/thread/${options.threadId}.json`,
			'data': thread
		});
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
		return { html, json };
	},

	buildBoard: async (options) => {
		const label = `/${options.board._id}/${options.page === 1 ? 'index' : options.page}.html`;
		const start = process.hrtime();
		const threads = await Posts.getRecent(options.board._id, options.page);
		if (!options.maxPage) {
			options.maxPage = Math.min(Math.ceil((await Posts.getPages(options.board._id)) / 10), Math.ceil(options.board.settings.threadLimit/10));
		}
		const pageText = options.page === 1 ? 'index' : options.page;
		options.managePage = `${pageText}.html`;
		const { html, json } = await render(label, 'board.pug', {
			...options,
			threads,
		}, {
			'name': `/${options.board._id}/${pageText}.json`,
			'data': threads
		});
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
		return { html, json };
	},

	//building multiple pages (for rebuilds)
	buildBoardMultiple: async (options) => {
		const start = process.hrtime();
		if (!options.board._id) {
			options.board = await Boards.findOne(options.board);
		}
		const maxPage = Math.min(Math.ceil((await Posts.getPages(options.board._id)) / 10), Math.ceil(options.board.settings.threadLimit/10)) || 1;
		if (options.endpage === 0) {
			//deleted only/all posts, so only 1 page will remain
			options.endpage = 1;
		} else if (maxPage < options.endpage || !options.endpage) {
			//else just build up to the max page if it is greater than input page number
			options.endpage = maxPage;
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
			const pageText = i === 1 ? 'index' : i;
			buildArray.push(
				render(`${options.board._id}/${pageText}.html`, 'board.pug', {
					board: options.board,
					threads: pageThreads,
					maxPage,
					page: i,
					managePage: `${pageText}.html`,
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
		const { html } = await render('news.html', 'news.pug', {
			news
		});
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
		return html;
	},

	buildCustomPage: async (options) => {
		const label = `/${options.board._id || options.board}/page/${options.page}.html`;
		const start = process.hrtime();
		if (!options.customPage) {
			const customPage = await CustomPages.findOne(options.board._id || options.board, options.page);
			if (!customPage) {
				return {};
			}
			options.customPage = customPage;
		}
		if (!options.board._id) {
			options.board = await Boards.findOne(options.board);
		}
		options.managePage = 'custompages.html';
		const { html, json } = await render(label, 'custompage.pug', {
			...options,
		}, {
			name: `/${options.board._id}/page/${options.page}.json`,
			data: options.customPage
		});
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
		return { html, json };
	},

	buildModLog: async (options) => {
		if (!options.startDate || !options.endDate) {
			const d = new Date();
			const month = d.getUTCMonth()
				, day = d.getUTCDate()
				, year = d.getUTCFullYear();
			options.startDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
			options.endDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
		}
		const day = ('0'+options.startDate.getDate()).slice(-2);
		const month = ('0'+(options.startDate.getMonth()+1)).slice(-2);
		const year = options.startDate.getFullYear();
		const label = `/${options.board._id}/logs/${month}-${day}-${year}.html`;
		const start = process.hrtime();
		if (!options.logs) {
			options.logs = await Modlogs.findBetweenDate(options.board, options.startDate, options.endDate);
		}
		options.managePage = 'logs.html';
		const projectedLogs = options.logs.map(l => {
			const pl = l;
			if (pl.showUser === false) {
				pl.user = null;
			}
			return pl;
		});
		const { html, json } = await render(label, 'modlog.pug', {
			...options
		}, {
			'name': `/${options.board._id}/logs/${month}-${day}-${year}.json`,
			'data': projectedLogs,
		});
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
		return { html, json };
	},

	buildModLogList: async (options) => {
		const label = `/${options.board._id}/logs.html`;
		const start = process.hrtime();
		let dates = await Modlogs.getDates(options.board._id);
		const { pruneModlogs } = config.get;
		if (pruneModlogs) {
			const pruneLogs = [];
			const pruneAfter = new Date(Date.now()-timeUtils.DAY*pruneModlogs);
			dates = dates.filter(date => {
				const { year, month, day } = date.date;
				if (new Date(year, month-1, day) > pruneAfter) { //-1 for 0-index months
					return true;
				}
				const logName = `${month}-${day}-${year}`;
				debugLogs && console.log('Pruning log', `${options.board._id}/${logName}`);
				pruneLogs.push(logName);
				return false;
			});
			if (pruneLogs.length > 0) {
				await Promise.all(pruneLogs.map(log => {
					return Promise.all([
						remove(`${uploadDirectory}/html/${options.board._id}/logs/${log}.html`),
						remove(`${uploadDirectory}/json/${options.board._id}/logs/${log}.json`),
					]);
				}));
				await Modlogs.deleteOld(options.board._id, pruneAfter);
			}
		}
		const { html, json } = await render(label, 'modloglist.pug', {
			board: options.board,
			dates,
			managePage: 'logs.html',
		}, {
			'name': `/${options.board._id}/logs.json`,
			'data': dates,
		});
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
		return { html, json };
	},

	buildHomepage: async () => {
		const { maxRecentNews } = config.get;
		const label = '/index.html';
		const start = process.hrtime();
		let [ totalStats, boards, fileStats, recentNews, hotThreads ] = await Promise.all([
			Boards.totalStats(), //overall total posts ever made
			Boards.boardSort(0, 20), //top 20 boards sorted by users, pph, total posts
			Files.activeContent(), //size and number of files
			News.find(maxRecentNews), //some recent newsposts
			Posts.hotThreads(), //top 5 threads last 7 days
		]);
		const [ localStats, webringStats ] = totalStats;
		const { html } = await render('index.html', 'home.pug', {
			localStats,
			webringStats,
			boards,
			fileStats,
			recentNews,
			hotThreads,
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
		buildQueue.push({
			'task': 'buildHomepage',
		});
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
		module.exports.resetTriggers();
	},

	resetTriggers: async() => {
		const label = 'Resetting pph/tph triggers';
		const start = process.hrtime();
		const triggeredBoards = await cache.sgetall('triggered'); //boards triggered pph/tph mode
		if (triggeredBoards.length === 0) {
			return; //no label is no triggers
		}
		await cache.del('triggered');
		const triggerModes = await Boards.triggerModes(triggeredBoards);
		const bulkWrites = triggerModes.map(p => {
			return {
				'updateOne': {
					'filter': {
						'_id': p._id
					},
					'update': {
						'$set': {
							/* reset=0 is "no change", the options go from 0-2, and get reset to 0 or 1,
							so if >0, we subtract 1 otherwise no change */
							'settings.lockMode': (p.lockReset > 0 ? Math.min(p.lockReset-1, p.lockMode) : p.lockMode),
							'settings.captchaMode': (p.captchaReset > 0 ? Math.min(p.captchaReset-1, p.captchaMode) : p.captchaMode),
						}
					}
				}
			};
		});
		await Boards.db.bulkWrite(bulkWrites);
		const promises = [];
		triggerModes.forEach(async (p) => {
			await cache.del(`board:${p._id}`);
			if (p.captchaReset > 0 && p.captchaReset-1 < p.captchaMode) {
				if (p.captchaReset-1 <= 1) {
					promises.push(remove(`${uploadDirectory}/html/${p._id}/thread/`));
				}
				if (p.captchaReset-1 === 0) {
					buildQueue.push({
						'task': 'buildBoardMultiple',
						'options': {
							'board': p._id,
							'startpage': 1,
							'endpage': Math.ceil(p.threadLimit/10)
						}
					});
					buildQueue.push({
						'task': 'buildCatalog',
						'options': {
							'board': p._id
						}
					});
				}
			}
		});
		await Promise.all(promises);
		const end = process.hrtime(start);
		debugLogs && console.log(timeDiffString(label, end));
	},

	buildChangePassword: async () => {
		const { html } = await render('changepassword.html', 'changepassword.pug');
		return html;
	},

	buildRegister: async () => {
		const { html } = await render('register.html', 'register.pug');
		return html;
	},

	buildBypass: async () => {
		const { html } = await render('bypass.html', 'bypass.pug');
		return html;
	},

	buildCreate: async () => {
		const { html } = await render('create.html', 'create.pug');
		return html;
	},

	buildCaptcha: async() => {
		const { html } = await render('captcha.html', 'captcha.pug');
		return html;
	},

};
