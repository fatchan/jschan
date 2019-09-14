'use strict';

module.exports = { //times in milliseconds
	'year': 31536000000,
	'month': 2592000000,
	'week': 604800000,
	'day': 86400000,
	'hour': 3600000,
	'minute': 60000,
	'nextHour': () => { return 3600000 - new Date().getTime() % 3600000 }
};
