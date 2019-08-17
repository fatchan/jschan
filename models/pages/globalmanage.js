'use strict';

const { Bans, News, Posts } = require(__dirname+'/../../db/')

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
