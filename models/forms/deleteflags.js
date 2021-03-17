'use strict';

const { remove } = require('fs-extra')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, { Boards } = require(__dirname+'/../../db/')

module.exports = async (req, res, next) => {

	const redirect = `/${req.params.board}/manage/assets.html`;

	const updatedFlags = res.locals.board.flags;

	//delete file of all selected flags
	await Promise.all(req.body.checkedflags.map(async flagName => {
		remove(`${uploadDirectory}/flag/${req.params.board}/${res.locals.board.flags[flagName]}`);
		delete res.locals.board.flags[flagName];
	}));

	//remove from db
	await Boards.setFlags(req.params.board, updatedFlags);

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': `Deleted flags.`,
		'redirect': redirect
	});
}
