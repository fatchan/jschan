'use strict';

module.exports = (filters, combinedString, strictCombinedString) => {

	for (const filter of filters) {
		const string = filter.strictFiltering ? strictCombinedString : combinedString;
		const hitFilter = filter.filters.find(match => { return string.includes(match.toLowerCase()); });
		if (hitFilter) {
			return [ hitFilter, filter.filterMode, filter.filterMessage, filter.filterBanDuration, filter.filterBanAppealable ];
		}
	}

	return false;

};
