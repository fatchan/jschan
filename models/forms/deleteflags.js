'use strict';

const { remove } = require('fs-extra')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, { Boards } = require(__dirname+'/../../db/')

module.exports = async (req, res, next) => {

	const redirect = `/${req.params.board}/manage/assets.html`;

	//delete file of all selected flags
	await Promise.all(req.body.checkedflags.map(async filename => {
		remove(`${uploadDirectory}/flag/${req.params.board}/${filename}`);
	}));

	//remove from db
	const amount = await Boards.removeFlags(req.params.board, req.body.checkedflags);

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': `Deleted flags.`,
		'redirect': redirect
	});
}
