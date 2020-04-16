'use strict';

module.exports = (label, end) => {
	return (`${end[0] > 0 ? end[0]+'s' : ''}${Math.trunc(end[1]/1000000)}ms `).padStart(9) + label;
}
