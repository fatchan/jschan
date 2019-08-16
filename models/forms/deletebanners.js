'use strict';

const { remove } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, { Boards } = require(__dirname+'/../../db/')
	, { buildBanners } = require(__dirname+'/../../helpers/build.js')

module.exports = async (req, res, next) => {

	const redirect = `/${req.params.board}/manage.html`;

	//delete file of all selected banners
	await Promise.all(req.body.checkedbanners.map(async filename => {
		remove(`${uploadDirectory}banner/${req.params.board}/${filename}`);
	}));

	//remove from db
	await Boards.removeBanners(req.params.board, req.body.checkedbanners);

	//update res locals banners in memory
	res.locals.board.banners = res.locals.board.banners.filter(banner => {
		 return !req.body.checkedbanners.includes(banner);
	});

	//rebuild public banners page
	await buildBanners(res.locals.board);

	return res.render('message', {
		'title': 'Success',
		'message': `Deleted banners.`,
		'redirect': redirect
	});
}
