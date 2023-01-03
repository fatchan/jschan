'use strict';

const Posts = require(__dirname+'/../../../db/posts.js')
	, { Permissions } = require(__dirname+'/../../../lib/permission/permissions.js');

module.exports = async (req, res, next) => {

	let reports;
	try {
		reports = await Posts.getReports(req.params.board, res.locals.permissions);
	} catch (err) {
		return next(err);
	}

	res.set('Cache-Control', 'private, max-age=5');

	if (req.path.endsWith('/reports.json')) {
		res.json({
			reports,
		});
	} else {
		res.render('managereports', {
			csrf: req.csrfToken(),
			reports,
			permissions: res.locals.permissions,
			viewRawIp: res.locals.permissions.get(Permissions.VIEW_RAW_IP),
		});
	}

};
