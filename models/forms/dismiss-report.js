'use strict';

const Posts = require(__dirname+'/../../db-models/posts.js')
	, hasPerms = require(__dirname+'/../../helpers/hasperms.js');

module.exports = async (req, res, next) => {

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

	await Posts.dismissReports(req.params.board, req.body.checkedposts);

	return `Dismissed report(s) successfully`;

}
