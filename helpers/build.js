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

	buildHomepage: async () => {
		const label = '/index.html';
		console.time(label);
		const [ activeUsers, postsPerHour ] = await Promise.all([
			Posts.db.aggregate([
				{
					'$match': {
						'_id': {
							'$gt': Mongo.ObjectId.createFromTime(Math.floor((Date.now() - msTime.day*3)/1000))
						}
					}
				},
				{
					'$group': {
						'_id': '$board',
						'ips': {
							'$addToSet': '$ip'
						}
					}
				},
				{
					'$project': {
						'ips': {
							'$size': '$ips'
						}
					}
				}
			]).toArray(),
			Posts.db.aggregate([
				{
					'$match': {
						'_id': {
							'$gt': Mongo.ObjectId.createFromTime(Math.floor((Date.now() - msTime.hour)/1000))
						}
					}
				},
				{
					'$group': {
						'_id': '$board',
						'pph': {
							'$sum': 1
						}
					}
				}
			]).toArray()
		]);
		for (let i = 0; i < activeUsers.length; i++) {
			const userboard = activeUsers[i];
			const pphboard = postsPerHour.find(b => b._id === userboard._id);
			if (pphboard != null) {
				userboard.pph = pphboard.pph;
			}
		}
		const bulkWrites = [];
		const updatedBoards = [];
		for (let i = 0; i < activeUsers.length; i++) {
			const data = activeUsers[i];
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
		await Boards.db.bulkWrite(bulkWrites);
		//getting boards now that pph is set
		const boards = await Boards.db.find({}).sort({
			'ips': -1,
			'pph': -1,
			'sequence_value': -1,
		}).limit(20).toArray(); //limit 20 homepage
		//might move filestats to an $out or $merge in schedules file
		const fileStats = await Files.db.aggregate([
			{
				'$group': {
					'_id': null,
					'count': {
						'$sum': 1
					},
					'size': {
						'$sum': '$size'
					}
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
