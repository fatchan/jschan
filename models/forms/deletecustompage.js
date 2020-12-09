'use strict';

const uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, { remove } = require('fs-extra')
	, { CustomPages } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js');

module.exports = async (req, res, next) => {

	await CustomPages.deleteMany(req.body.checkedcustompages, req.params.board);

	await Promise.all(req.body.checkedcustompages.map(page => {
		remove(`${uploadDirectory}/html/${req.params.board}/custompage/${page}.html`)
	}));

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': 'Deleted custom pages',
		'redirect': `/${req.params.board}/manage/custompages.html`
	});

}
