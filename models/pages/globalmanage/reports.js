'use strict';

const { Posts } = require(__dirname+'/../../../db/');

module.exports = async (req, res, next) => {

	let reports;
	try {
		reports = await Posts.getGlobalReports();
	} catch (err) {
		return next(err)
	}

	res.render('globalmanagereports', {
		csrf: req.csrfToken(),
		reports,
	});

}
