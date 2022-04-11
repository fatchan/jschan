'use strict';

const uploadDirectory = require(__dirname+'/../../lib/file/uploaddirectory.js')
	, { remove } = require('fs-extra')
	, { CustomPages } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js');

module.exports = async (req, res, next) => {

	const deletedCount = await CustomPages.deleteMany(req.body.checkedcustompages, req.params.board).then(res => res.deletedCount);

	if (deletedCount === 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad Request',
			'message': 'Invalid custom pages selected',
			'redirect': `/${req.params.board}/manage/custompages.html`
		});
	}

	await Promise.all(req.body.checkedcustompages.map(page => {
		remove(`${uploadDirectory}/html/${req.params.board}/custompage/${page}.html`)
	}));

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': 'Deleted custom pages',
		'redirect': `/${req.params.board}/manage/custompages.html`
	});

}
