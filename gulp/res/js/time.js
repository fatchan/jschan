!localStorage.getItem('relative') ? setLocalStorage('relative', false) : void 0;
let relativeTime = localStorage.getItem('relative') == 'true';

!localStorage.getItem('24hour') ? setLocalStorage('24hour', false) : void 0;
let hour24 = localStorage.getItem('24hour') == 'true';

let dates = [];
const dateElems = document.getElementsByClassName('post-date');
for (let i = 0; i < dateElems.length; i++) {
	dates.push(dateElems[i]); //convert to array
}

const YEAR = 31536000000
	, MONTH = 2592000000
	, WEEK = 604800000
	, DAY = 86400000
	, HOUR = 3600000
	, MINUTE = 60000;

const relativeTimeString = (date) => {
    const difference = Date.now() - new Date(date).getTime();
    let amount = 0;
    let ret = '';
    if (difference < MINUTE) {
        return 'Now';
    } else if (difference < HOUR) {
        amount = Math.round(difference / MINUTE);
        ret = `${amount} minute`;
    } else if (difference < DAY) {
        amount = Math.round(difference / HOUR);
        ret = `${amount} hour`;
    } else if (difference < WEEK) {
        amount = Math.round(difference / DAY);
        ret = `${amount} day`;;
    } else if (difference < MONTH) {
        amount = Math.round(difference / WEEK);
        ret = `${amount} week`;
    } else if (difference < YEAR) {
        amount = Math.round(difference / MONTH);
        ret = `${amount} month`;
    } else {
        return '> 1 year ago';
    }
    return `${ret}${amount > 1 ? 's' : ''} ago`;
}

const changeDateFormat = (date) => {
	const dateString = new Date(date.dateTime).toLocaleString(0, {hour12: !hour24});
	if (relativeTime) {
		date.innerText = relativeTimeString(date.dateTime);
		date.title = dateString;
	} else {
		date.innerText = dateString;
		date.title = '';
	}
}

const updateDates = () => {
	for (let i = 0; i < dates.length; i++) {
		changeDateFormat(dates[i]);
	}
}

updateDates();

window.addEventListener('settingsReady', function(event) {

	let relativeInterval = relativeTime ? setInterval(updateDates, MINUTE) : void 0;

	const hour24Setting = document.getElementById('24hour-setting');
	const togglehour24 = () => {
		hour24 = !hour24;
		setLocalStorage('24hour', hour24);
		updateDates();
		console.log('toggling 24h time', hour24);
	}
	hour24Setting.checked = hour24;
	hour24Setting.addEventListener('change', togglehour24, false);

	const relativeTimeSetting = document.getElementById('relative-setting');
	const togglerelativeTime = () => {
		relativeTime = !relativeTime;
		setLocalStorage('relative', relativeTime);
		updateDates();
		if (relativeTime) {
			relativeInterval = setInterval(updateDates, MINUTE);
		} else {
			clearInterval(relativeInterval);
		}
		console.log('toggling relative time', relativeTime);
	}
	relativeTimeSetting.checked = relativeTime;
	relativeTimeSetting.addEventListener('change', togglerelativeTime, false);

});

window.addEventListener('addPost', function(e) {

	const date = e.detail.post.querySelector('.post-date');
	if (!e.detail.hover) {
		dates.push(date);
	}
	changeDateFormat(date);

});
