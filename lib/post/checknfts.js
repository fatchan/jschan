'use strict';

module.exports = (filters, combinedString, strictCombinedString) => {

	let filterHits = [];
	for (const filter of filters) {
		if (filter.filterMode === 0) { continue; } //skip "Do nothing" mode filters
		const string = filter.strictFiltering ? strictCombinedString : combinedString;
		const hitFilter = filter.filters.find(match => string.includes(match.toLowerCase()) );
		if (hitFilter) {
			//if either of these are hit, we can stop checking
			if (filter.filterMode === 1 || filter.filterMode === 2) {
				return [{ h: hitFilter, f: filter }];
			} else {
				filterHits.push({ h: hitFilter, f: filter });
			}
		}
	}

	return filterHits.length ? filterHits : false;

};
