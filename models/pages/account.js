'use strict';

const Posts = require(__dirname+'/../../db/posts.js');

module.exports = async (req, res, next) => {

	let boardReportCountMap = {}; //map of board to open report count
	let globalReportCount = 0; //number of open global reports

	let boardReportCounts;
	try {
		const userBoards = res.locals.user.ownedBoards.concat(res.locals.user.modBoards);
		([boardReportCounts, globalReportCount] = await Promise.all([
			//if user owns or mods any boards, get the open report count for them
			userBoards.length > 0 ? Posts.getBoardReportCounts(userBoards) : [],
			//if user is global staff get the open global report count
			res.locals.user.authLevel <= 1 ? Posts.getGlobalReportsCount() : 0
		]));
	} catch (err) {
		return next(err)
	}

	if (boardReportCounts && boardReportCounts.length > 0) {
		//make the aggregate array from mongodb to a map
		boardReportCountMap = boardReportCounts.reduce((acc, val) => {
			acc[val._id] = val.count;
			return acc;
		}, boardReportCountMap);
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
