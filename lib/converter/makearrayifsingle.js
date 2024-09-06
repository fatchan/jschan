'use strict';

function makeArrayIfSingle(obj) {
	return !Array.isArray(obj) ? [obj] : obj;
}

module.exports = makeArrayIfSingle;
