'use strict';

module.exports = (query, limit) => {
	query = query || {};
	const nopage = { ...query };
	delete nopage.page;
	const queryString = new URLSearchParams(nopage).toString();
	let page;
	if (query.page && Number.isSafeInteger(parseInt(query.page, 10))) {
		page = parseInt(query.page, 10);
		if (page <= 0) {
			page = 1;
		}
	} else {
		page = 1;
	}
	const offset = (page-1) * limit;
	return { queryString, page, offset };
}
