'use strict';

const { News } = require(__dirname+'/../../db/')
	, buildQueue = require(__dirname+'/../../queue.js')

module.exports = async (req, res, next) => {

	await News.deleteMany(req.body.checkednews);

	buildQueue.push({
		'task': 'buildNews',
		'options': {}
	});

	return res.render('message', {
		'title': 'Success',
		'message': 'Deleted news',
		'redirect': '/globalmanage/news.html'
	});

}
