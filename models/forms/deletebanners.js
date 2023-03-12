
'use strict';

const { remove } = require('fs-extra')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, uploadDirectory = require(__dirname+'/../../lib/file/uploaddirectory.js')
	, { Boards } = require(__dirname+'/../../db/')
	, buildQueue = require(__dirname+'/../../lib/build/queue.js');

module.exports = async (req, res) => {

	const { __ } = res.locals;
	const redirect = `/${req.params.board}/manage/assets.html`;

	//delete file of all selected banners
	await Promise.all(req.body.checkedbanners.map(filename => {
		remove(`${uploadDirectory}/banner/${req.params.board}/${filename}`);
	}));

	//remove from db
	await Boards.removeBanners(req.params.board, req.body.checkedbanners);

	//update res locals banners in memory
	const beforeBanners = res.locals.board.banners.length;
	res.locals.board.banners = res.locals.board.banners.filter(banner => {
		return !req.body.checkedbanners.includes(banner);
	});

	//rebuild public banners page
	buildQueue.push({
		'task': 'buildBanners',
		'options': {
			'board': res.locals.board,
		}
	});

	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __('Deleted %s banners', beforeBanners - res.locals.board.banners.length),
		'redirect': redirect
	});
};
