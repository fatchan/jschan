'use strict';

const Posts = require(__dirname+'/../../db/posts.js')
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

	const dismissedReports = await Posts.dismissReports(req.params.board, req.body.checkedposts).then(result => result.modifiedCount);

	return `Dismissed ${dismissedReports} reports successfully`;

}
