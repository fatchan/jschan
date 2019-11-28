'use strict';

const { Accounts } = require(__dirname+'/../../../db/')
	, pageQueryConverter = require(__dirname+'/../../../helpers/pagequeryconverter.js')
	, limit = 20;

module.exports = async (req, res, next) => {

	const { page, offset } = pageQueryConverter(req.query, limit);

	let accounts, maxPage;
	try {
		[accounts, maxPage] = await Promise.all([
			Accounts.find(offset, limit),
			Accounts.count(),
		]);
		maxPage = Math.ceil(maxPage/limit);
	} catch (err) {
		return next(err)
	}

	res.render('globalmanageaccounts', {
		csrf: req.csrfToken(),
		accounts,
		page,
		maxPage,
	});

}
