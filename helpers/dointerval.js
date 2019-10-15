'use strict';

module.exports = (func, interval, runFirst) => {
	if (runFirst) {
		func();
	}
	setInterval(func, interval);
}
