'use strict';

const YEAR = 31536000000
	, MONTH = 2629800000
	, WEEK = 604800000
	, DAY = 86400000
	, HOUR = 3600000
	, MINUTE = 60000
	, SECOND = 1000;

module.exports = {

	YEAR, MONTH, WEEK, DAY, HOUR, MINUTE, SECOND,

	//ms until next hour
	'nextHour': () => {
		return 3600000 - new Date().getTime() % 3600000;
	},

	//string representing how long since date A to date B
	'relativeString': (now, relativeTo, locals) => {
		let difference = now.getTime() - relativeTo.getTime();
		let amount = 0;
		let unit = '';
		let isFuture = false;
		if (difference < 0) {
			difference = Math.abs(difference);
			isFuture = true;
		}
		if (difference < MINUTE) {
			return locals.__('Now');
		} else if (difference < MINUTE*59.5) {
			amount = Math.round(difference / MINUTE);
			unit = 'minute';
		} else if (difference < HOUR*23.5) {
			amount = Math.round(difference / HOUR);
			unit = 'hour';
		} else if (difference < DAY*6.5) {
			amount = Math.round(difference / DAY);
			unit = 'day';
		} else if (difference < WEEK*3.5) {
			amount = Math.round(difference / WEEK);
			unit = 'week';
		} else if (difference < MONTH*11.5) {
			amount = Math.round(difference / MONTH);
			unit = 'month';
		} else {
			amount = Math.round(difference / YEAR);
			unit = 'year';
		}
		return locals.__n(`%s ${unit} ${isFuture ? 'from now' :  'ago'}`, amount);
	},

	'relativeColor': (now, relativeTo) => {
		const difference = now.getTime() - relativeTo.getTime();
		const minutesAgo = Math.floor(difference / MINUTE);
		let r = 0
			, g = 0
			, b = 0;
		if (difference < MINUTE) {
			g = 0.7;
			b = 1;
		} else if (difference < HOUR) {
			r = (minutesAgo / 60) * 0.5;
			g = 1;
		} else if (difference < DAY) {
			r = 0.5 + (minutesAgo / 1440) * 0.5;
			g = 1;
		} else if (difference < WEEK) {
			g = 1 - (minutesAgo / 10080) * 0.5;
			r = 1;
		} else if (difference < MONTH) {
			g = 0.5 - (minutesAgo / 43830) * 0.5;
			r = 1;
		} else if (difference < YEAR) {
			r = 1 - (minutesAgo / 525960);
		} //else, leave it black for >1 year
		r = (Math.round(r*255*0.85).toString(16)).padStart(2, '0');
		g = (Math.round(g*255*0.85).toString(16)).padStart(2, '0');
		b = (Math.round(b*255).toString(16)).padStart(2, '0');
		return `#${r}${g}${b}`;
	},

	'durationString': (ms) => {
		const durString = new Date(ms).toISOString();
		if (ms < DAY) {
			return durString.substr(11,8).replace(/^00:/, '');
		} else {
			const hours = Math.floor(ms/HOUR);
			return `${hours}:${durString.substring(14,19)}`;
		}
	},

	'timeDiffString': (label, end) => {
		return (`${end[0] > 0 ? end[0]+'s' : ''}${Math.trunc(end[1]/1000000)}ms `).padStart(9) + label;
	},

};
