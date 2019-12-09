'use strict';

const { Boards, Posts, Accounts } = require(__dirname+'/../../db/')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, buildQueue = require(__dirname+'/../../queue.js')
	, cache = require(__dirname+'/../../redis.js')
	, { remove } = require('fs-extra');

module.exports = async (req, res, next) => {

	const promises = [];
	const oldSettings = await cache.get('globalsettings');
	const newSettings = {
		'captchaMode': typeof req.body.captcha_mode === 'number' && req.body.captcha_mode !== oldSettings.captchaMode ? req.body.captcha_mode : oldSettings.captchaMode,
		'filters': req.body.filters !== null ? req.body.filters.split('\r\n').filter(n => n).slice(0,50) : oldSettings.filters,
		'filterMode': typeof req.body.filter_mode === 'number' && req.body.filter_mode !== oldSettings.filterMode ? req.body.filter_mode : oldSettings.filterMode,
		'filterBanDuration': typeof req.body.ban_duration === 'number' && req.body.ban_duration !== oldSettings.filterBanDuration ? req.body.ban_duration : oldSettings.filterBanDuration,
	};

	cache.set('globalsettings', newSettings);

	let rebuildThreads = false
		, rebuildBoard = false
		, rebuildCatalog = false;

	if (newSettings.captchaMode > oldSettings.captchaMode) {
		rebuildBoard = true;
		rebuildCatalog = true;
		if (newSettings.captchaMode == 2) {
			rebuildThreads = true; //thread captcha enabled, removes threads
		}
//todo: implement removing pages/rebuilding for all affected boards
//i.e. query for ones with settings.catchaMode < newSettings.captchaMode
		/*
		const affectedBoards = //////
		for (let i = 0; i < affectedBoards.length; i++) {
			const board = affectedBoards[i];
			if (rebuildThreads) {
				promises.push(remove(`${uploadDirectory}/html/${board._id}/thread/`));
			}
			if (rebuildBoard) {
				buildQueue.push({
					'task': 'buildBoardMultiple',
					'options': {
						board,
						'startpage': 1,
						'endpage': null //no endpage will use whatver maxpage of board is
					}
				});
			}
			if (rebuildCatalog) {
				buildQueue.push({
					'task': 'buildCatalog',
					'options': {
						board,
					}
				});
			}
		}
		*/
	}

	//finish the promises in parallel e.g. removing files
	if (promises.length > 0) {
		await Promise.all(promises);
	}

	return res.render('message', {
		'title': 'Success',
		'message': 'Updated settings.',
		'redirect': '/globalmanage/settings.html'
	});

}
