'use strict';

const { Accounts } = require(__dirname+'/../../../db/')
	, pageQueryConverter = require(__dirname+'/../../../helpers/pagequeryconverter.js')
	, limit = 20;

module.exports = async (req, res, next) => {

	const { page, offset, queryString } = pageQueryConverter(req.query, limit);

    let filter = {};
	const username = req.query.username;
    if (username && !Array.isArray(username)) {
        filter['_id'] = username;
    }
	const uri = req.query.uri;
    if (uri && !Array.isArray(uri)) {
        filter['$or'] = [
			{
				'ownedBoards': uri
			},
			{
				'modBoards': uri
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

	res.render('globalmanageaccounts', {
		csrf: req.csrfToken(),
		queryString,
		username,
		uri,
		accounts,
		page,
		maxPage,
	});

}
