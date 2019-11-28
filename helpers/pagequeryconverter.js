'use strict';

module.exports = (query, limit) => {
	const nopage = { ...query };
	delete nopage.page;
	const queryString = new URLSearchParams(nopage).toString();
	let page;
	if (query.page && Number.isSafeInteger(parseInt(query.page))) {
		page = parseInt(query.page);
		if (page <= 0) {
			page = 1;
		}
	} else {
		page = 1;
	}
	const offset = (page-1) * limit;
	return { queryString, page, offset };
}
