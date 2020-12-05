'use strict';

const Posts = require(__dirname+'/../../db/posts.js');

module.exports = async (req, res, next) => {

	const userBoards = res.locals.user.ownedBoards.concat(res.locals.user.modBoards);
	let boardReportCountMap = {};
	let globalReportCount = 0;

	if (userBoards.length > 0) {
		let boardReportCounts;
		try {
			([boardReportCounts, globalReportCount] = await Promise.all([
				Posts.getBoardReportCounts(userBoards),
				res.locals.user.authLevel <= 1 ? Posts.getGlobalReportsCount() : 0
			]));
		} catch (err) {
			return next(err)
		}

		if (boardReportCounts && boardReportCounts.length > 0) {
			boardReportCountMap = boardReportCounts.reduce((acc, val) => {
				acc[val._id] = val.count;
				return acc;
			}, boardReportCountMap);
		}
	}

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('account', {
		csrf: req.csrfToken(),
		user: res.locals.user,
		boardReportCountMap,
		globalReportCount,
	});

}
