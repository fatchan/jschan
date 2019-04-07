'use strict';

const Posts = require(__dirname+'/../../db-models/posts.js')
	, hasPerms = require(__dirname+'/../../helpers/has-perms.js');

module.exports = async (req, res) => {

	if (!hasPerms(req, res)) {
		return res.status(403).render('message', {
			'title': 'Forbidden',
			'message': `You are not authorised to dismiss reports.`,
			'redirect': `/${req.params.board}`
		});
	}

	try {
		//dismiss reports from all checked posts
		await Posts.dismissReports(req.params.board, req.body.checked);
	} catch (err) {
		console.error(err);
		return res.status(500).render('error');
	}

	//hooray!
	return res.render('message', {
		'title': 'Success',
		'message': `Dismissed report(s) successfully`,
		'redirect': `/${req.params.board}/manage`
	});

}
