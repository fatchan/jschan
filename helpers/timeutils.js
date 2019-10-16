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
		let color;
		if (difference < MINUTE) {
			return { color: '#39d6bc', text:'Now' };
		} else if (difference < HOUR) {
			amount = Math.floor(difference / MINUTE);
			color = '#008000';
			ret += `${amount} minute`
		} else if (difference < DAY) {
			amount = Math.floor(difference / HOUR);
			color = '#84c100';
			ret += `${amount} hour`
		} else if (difference < WEEK) {
			amount = Math.floor(difference / DAY);
			color = '#fffd00';
			ret += `${amount} day`;
		} else if (difference < MONTH) {
			amount = Math.floor(difference / WEEK);
			color = '#ff6700';
			ret += `${amount} week`;
		} else if (difference < YEAR) {
			amount = Math.floor(difference / MONTH);
			color = '#ff0000';
			ret += `${amount} month`;
		} else {
			return { color: '#ff000047', text: 'More than a year ago' };
		}
		return { color, text: `${ret}${amount > 1 ? 's' : ''} ago` };
	}

};
