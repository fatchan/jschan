
'use strict';

const { remove } = require('fs-extra')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, uploadDirectory = require(__dirname+'/../../lib/file/uploaddirectory.js')
	, { Boards } = require(__dirname+'/../../db/');

module.exports = async (req, res) => {

	const { __ } = res.locals;
	const redirect = `/${req.params.board}/manage/assets.html`;

	//delete file of all selected assets
	await Promise.all(req.body.checkedassets.map(async filename => {
		remove(`${uploadDirectory}/asset/${req.params.board}/${filename}`);
	}));

	//remove from db
	const amount = await Boards.removeAssets(req.params.board, req.body.checkedassets).then(result => result.modifiedCount);

	//update res locals assets in memory
	res.locals.board.assets = res.locals.board.assets.filter(asset => {
		return !req.body.checkedassets.includes(asset);
	});

	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __('Deleted %s assets', amount),
		'redirect': redirect
	});
};
