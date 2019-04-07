'use strict';

const Posts = require(__dirname+'/../../db-models/posts.js');

module.exports = async (req, res) => {

	const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
	const report = {
		'reason': req.body.reason,
		'date': new Date(),
		'ip': ip
	}

	try {
		//push the report to all checked posts
		await Posts.reportMany(req.params.board, req.body.checked, report);
	} catch (err) {
		console.error(err);
		return res.status(500).render('error');
	}

	//hooray!
	return res.render('message', {
		'title': 'Success',
		'message': `Reported post(s) successfully`,
		'redirect': `/${req.params.board}`
	});

}
