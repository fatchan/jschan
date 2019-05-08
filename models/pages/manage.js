'use strict';

const Posts = require(__dirname+'/../../db/posts.js')
	, Bans = require(__dirname+'/../../db/bans.js')
	, writePageHTML = require(__dirname+'/../../helpers/writepagehtml.js');

module.exports = async (req, res, next) => {

	let reports;
	let bans;
	try {
		reports = await Posts.getReports(req.params.board);
		bans = await Bans.getBoardBans(req.params.board);
	} catch (err) {
		return next(err)
	}

	//render the page
	res.render('manage', {
		csrf: req.csrfToken(),
		reports,
		bans,
	});

}
