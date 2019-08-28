'use strict';

const { Bans, News, Posts, Accounts } = require(__dirname+'/../../db/')

module.exports = async (req, res, next) => {

	let reports, bans, news, accounts;
	try {
		[ reports, bans, news, accounts ] = await Promise.all([
			Posts.getGlobalReports(),
			Bans.getGlobalBans(),
			News.find(),
			Accounts.find(),
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
		accounts,
	});

}
