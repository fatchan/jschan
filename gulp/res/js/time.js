!localStorage.getItem('localtime') ? setLocalStorage('localtime', true) : void 0;
!localStorage.getItem('hour12') ? setLocalStorage('hour12', false) : void 0;

let localTime = localStorage.getItem('localtime') == 'true';
let hour12 = localStorage.getItem('hour12') == 'true';

const makeDateLocal = (date) => {
	date.innerText = new Date(date.dateTime).toLocaleString(0, {hour12: !hour12});
}

if (localTime) {
	const dates = document.getElementsByClassName('post-date');
	for (let i = 0; i < dates.length; i++) {
		makeDateLocal(dates[i]);
	}
}

window.addEventListener('settingsReady', function(event) {

	const timeSetting = document.getElementById('time-setting');
	const hour12Setting = document.getElementById('hour12-setting');

	const toggleLocalTime = () => {
		localTime = !localTime;
		setLocalStorage('localtime', localTime);
		console.log('toggling local time', localTime);
	}
	timeSetting.checked = localTime;
	timeSetting.addEventListener('change', toggleLocalTime, false);

	const toggleHour12 = () => {
		hour12 = !hour12;
		setLocalStorage('hour12', hour12);
		console.log('toggling 24h time', hour12);
	}
	hour12Setting.checked = hour12;
	hour12Setting.addEventListener('change', toggleHour12, false);

});

window.addEventListener('addPost', function(e) {

	const date = e.detail.post.querySelector('.post-date');
	if (localTime) {
		makeDateLocal(date);
	}

});
