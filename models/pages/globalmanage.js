'use strict';

const Posts = require(__dirname+'/../../db/posts.js')
	, Bans = require(__dirname+'/../../db/bans.js')
	, News = require(__dirname+'/../../db/news.js');

module.exports = async (req, res, next) => {

	let reports, bans, news;
	try {
		[ reports, bans, news ] = await Promise.all([
			Posts.getGlobalReports(),
			Bans.getGlobalBans(),
			News.find()
		]);
	} catch (err) {
		return next(err)
	}

	//render the page
	res.render('globalmanage', {
		csrf: req.csrfToken(),
		reports,
		bans,
		news,
	});

}
