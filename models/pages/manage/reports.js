'use strict';

const Posts = require(__dirname+'/../../../db/posts.js')
	, { ipHashPermLevel } = require(__dirname+'/../../../configs/main.js')
	, hashIp = require(__dirname+'/../../../helpers/haship.js');

module.exports = async (req, res, next) => {

	let reports;
	try {
		reports = await Posts.getReports(req.params.board);
	} catch (err) {
		return next(err)
	}

    if (ipHashPermLevel !== -1
		&& res.locals.permLevel > ipHashPermLevel) {
        for (let i = 0; i < reports.length; i++) {
            reports[i].ip.single = hashIp(reports[i].ip.single);
        }
    }

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('managereports', {
		csrf: req.csrfToken(),
		reports,
	});

}
