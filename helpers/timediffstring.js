'use strict';

module.exports = (label, end) => {
	return `${label} -> ${end[0] > 0 ? end[0]+'s ' : ''}${(end[1]/1000000).toFixed(2)}ms`;
}
