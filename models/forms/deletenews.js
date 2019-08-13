'use strict';

const News = require(__dirname+'/../../db/news.js')
	, { buildNews } = require(__dirname+'/../../helpers/build.js')

module.exports = async (req, res, next) => {

	await News.deleteMany(req.body.checkednews);

	await buildNews();

	return res.render('message', {
		'title': 'Success',
		'message': 'Deleted news',
		'redirect': '/globalmanage.html'
	});

}
