'use strict';

const YEAR = 31536000000
	, MONTH = 2592000000
	, WEEK = 604800000
	, DAY = 86400000
	, HOUR = 3600000
	, MINUTE = 60000;

module.exports = {

	YEAR, MONTH, WEEK, DAY, HOUR, MINUTE,

	//ms until next hour
	'nextHour': () => {
		return 3600000 - new Date().getTime() % 3600000;
	},

	//string representing how long since date A to date B
	'relativeString': (currentTime, eventTime) => {
		const difference = currentTime.getTime() - eventTime.getTime();
		let amount = 0;
		let ret = '';
		if (difference < MINUTE) {
			return 'Now';
		} else if (difference < HOUR) {
			amount = Math.floor(difference / MINUTE);
			ret += `${amount} minute`
		} else if (difference < DAY) {
			amount = Math.floor(difference / HOUR);
			ret += `${amount} hour`
		} else if (difference < WEEK) {
			amount = Math.floor(difference / DAY);
			ret += `${amount} day`;
		} else if (difference < MONTH) {
			amount = Math.floor(difference / WEEK);
			ret += `${amount} week`;
		} else if (difference < YEAR) {
			amount = Math.floor(difference / MONTH);
			ret += `${amount} month`;
		} else {
			return 'More than a year ago';
		}
		return `${ret}${amount > 1 ? 's' : ''} ago`;
	}

};
