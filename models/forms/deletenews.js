'use strict';

const { News } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, buildQueue = require(__dirname+'/../../lib/build/queue.js');

module.exports = async (req, res) => {

	const { __ } = res.locals;

	await News.deleteMany(req.body.checkednews);

	buildQueue.push({
		'task': 'buildNews',
		'options': {}
	});

	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __('Deleted news'),
		'redirect': '/globalmanage/news.html'
	});

};
