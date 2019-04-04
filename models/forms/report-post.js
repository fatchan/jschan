'use strict';

const Posts = require(__dirname+'/../../db-models/posts.js');

module.exports = async (req, res) => {

	try {
		//push the report to all checked posts
		await Posts.reportMany(req.params.board, req.body.checked, req.body.report);
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
