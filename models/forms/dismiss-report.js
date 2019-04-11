'use strict';

const Posts = require(__dirname+'/../../db-models/posts.js')
	, hasPerms = require(__dirname+'/../../helpers/has-perms.js');

module.exports = async (req, res) => {

	if (!hasPerms(req, res)) {
		throw {
			'status': 403,
			'message': {
				'title': 'Forbidden',
				'message': `You are not authorised to dismiss reports.`,
				'redirect': `/${req.params.board}`
			}
		};
	}

	await Posts.dismissReports(req.params.board, req.body.checked);

	return `Dismissed report(s) successfully`

}
