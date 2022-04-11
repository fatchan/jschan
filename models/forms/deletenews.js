'use strict';

const { News } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, buildQueue = require(__dirname+'/../../lib/build/queue.js')

module.exports = async (req, res, next) => {

	await News.deleteMany(req.body.checkednews);

	buildQueue.push({
		'task': 'buildNews',
		'options': {}
	});

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': 'Deleted news',
		'redirect': '/globalmanage/news.html'
	});

}
