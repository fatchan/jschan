'use strict';

const YEAR = 31536000000
	, MONTH = 2629800000
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
	'relativeString': (now, relativeTo) => {
		const difference = now.getTime() - relativeTo.getTime();
		let amount = 0;
		let ret = '';
		if (difference < MINUTE) {
			return 'Now';
		} else if (difference < MINUTE*59.5) {
			amount = Math.round(difference / MINUTE);
			ret += `${amount} minute`;
		} else if (difference < HOUR*23.5) {
			amount = Math.round(difference / HOUR);
			ret += `${amount} hour`;
		} else if (difference < DAY*6.5) {
			amount = Math.round(difference / DAY);
			ret += `${amount} day`;
		} else if (difference < WEEK*3.5) {
			amount = Math.round(difference / WEEK);
			ret += `${amount} week`;
		} else if (difference < MONTH*11.5) {
			amount = Math.round(difference / MONTH);
			ret += `${amount} month`;
		} else {
			return 'More than a year ago';
		}
		return `${ret}${amount > 1 ? 's' : ''} ago`;
	},

	'relativeColor': (now, relativeTo) => {
		const difference = now.getTime() - relativeTo.getTime();
		let r = 0
			, g = 0
			, b = 0;
		if (difference < MINUTE) {
			g = 170;
			b = 255;
		} else if (difference < HOUR) {
			r = (difference / HOUR) * 127;
			g = 255;
		} else if (difference < DAY) {
			r = 127 + (difference / DAY) * 127;
			g = 255;
		} else if (difference < WEEK) {
			g = 255 - (difference / WEEK) * 127;
			r = 255;
		} else if (difference < MONTH) {
			g = 128 - (difference / MONTH) * 127;
			r = 255;
		} else if (difference < YEAR) {
			r = 255 - (difference / YEAR) * 255
		} //else, leave it black for >1 year
		r = (Math.round(r*0.85).toString(16)).padStart(2, '0');
		g = (Math.round(g*0.85).toString(16)).padStart(2, '0');
		b = (Math.round(b).toString(16)).padStart(2, '0');
		return `#${r}${g}${b}`;
	}

};
