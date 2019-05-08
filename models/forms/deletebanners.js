'use strict';

const remove = require('fs-extra').remove
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
	, Boards = require(__dirname+'/../../db/boards.js');

module.exports = async (req, res, next) => {

	const redirect = `/${req.params.board}/manage.html`

	await Promise.all(req.body.checkedbanners.map(async filename => {
		remove(`${uploadDirectory}banner/${filename}`);
	}));

	// i dont think there is a way to get the number of array items removed with $pullAll 
	// so i cant return how many banners were deleted
	await Boards.removeBanners(req.params.board, req.body.checkedbanners);

	return res.render('message', {
		'title': 'Success',
		'message': `Deleted banners.`,
		'redirect': redirect
	});
}
