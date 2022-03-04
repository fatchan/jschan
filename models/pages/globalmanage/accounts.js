'use strict';

const { Accounts } = require(__dirname+'/../../../db/')
	, roleManager = require(__dirname+'/../../../helpers/rolemanager.js')
	, pageQueryConverter = require(__dirname+'/../../../helpers/pagequeryconverter.js')
	, limit = 20;

module.exports = async (req, res, next) => {

	const { page, offset, queryString } = pageQueryConverter(req.query, limit);

	let filter = {};
	const username = (typeof req.query.username === 'string' ? req.query.username : null);
	if (username) {
		filter['_id'] = username;
	}
	const uri = (typeof req.query.uri === 'string' ? req.query.uri  : null);
	if (uri) {
		filter['$or'] = [
			{
				'ownedBoards': uri
			},
			{
				'staffBoards': uri
			},
		];
	}

	let accounts, maxPage;
	try {
		[accounts, maxPage] = await Promise.all([
			Accounts.find(filter, offset, limit),
			Accounts.count(filter),
		]);
		maxPage = Math.ceil(maxPage/limit);
	} catch (err) {
		return next(err)
	}

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('globalmanageaccounts', {
		csrf: req.csrfToken(),
		permissions: res.locals.permissions,
		user: res.locals.user,
		queryString,
		username,
		uri,
		accounts,
		page,
		maxPage,
		roleNameMap: roleManager.roleNameMap,
	});

}
