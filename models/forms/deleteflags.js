'use strict';

const { remove } = require('fs-extra')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, uploadDirectory = require(__dirname+'/../../lib/file/uploaddirectory.js')
	, { Boards } = require(__dirname+'/../../db/')
	, buildQueue = require(__dirname+'/../../lib/build/queue.js');

module.exports = async (req, res) => {

	const { __ } = res.locals;
	const redirect = `/${req.params.board}/manage/assets.html`;

	const updatedFlags = res.locals.board.flags;

	//delete file of all selected flags
	await Promise.all(req.body.checkedflags.map(async flagName => {
		remove(`${uploadDirectory}/flag/${req.params.board}/${res.locals.board.flags[flagName]}`);
		delete res.locals.board.flags[flagName];
	}));

	//remove from db
	await Boards.setFlags(req.params.board, updatedFlags);

	await remove(`${uploadDirectory}/html/${req.params.board}/thread/`);
	buildQueue.push({
		'task': 'buildBoardMultiple',
		'options': {
			'board': res.locals.board,
			'startpage': 1,
			'endpage': Math.ceil(res.locals.board.settings.threadLimit/10),
		}
	});
	buildQueue.push({
		'task': 'buildCatalog',
		'options': {
			'board': res.locals.board,
		}
	});

	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __('Deleted flags'),
		'redirect': redirect
	});
};
