'use strict';

const uuidv4 = require('uuid/v4')
	, path = require('path')
	, util = require('util')
	, fs = require('fs')
	, unlink = util.promisify(fs.unlink)
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
	, Boards = require(__dirname+'/../../db/boards.js');

module.exports = async (req, res, next) => {

	const redirect = `/${req.params.board}/manage`

	await Promise.all(req.body.checkedbanners.map(async filename => {
		unlink(`${uploadDirectory}banner/${filename}`);
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
