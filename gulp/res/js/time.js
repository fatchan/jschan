!localStorage.getItem('localtime') ? setLocalStorage('localtime', true) : void 0;

let localTime = localStorage.getItem('localtime') == 'true';

const makeDateLocal = (date) => {
	date.innerText = new Date(date.dateTime).toLocaleString(0, {hour12:false});
}

if (localTime) {
	const dates = document.getElementsByClassName('post-date');
	for (let i = 0; i < dates.length; i++) {
		makeDateLocal(dates[i]);
	}
}

window.addEventListener('settingsReady', function(event) {

	const timeSetting = document.getElementById('time-setting');
	const toggleLocalTime = () => {
		localTime = !localTime;
		setLocalStorage('localtime', localTime);
		console.log('toggling local time', localTime);
	}
	timeSetting.checked = localTime;
	timeSetting.addEventListener('change', toggleLocalTime, false);

});

window.addEventListener('addPost', function(e) {

	const date = e.detail.post.querySelector('.post-date');
	if (localTime) {
		makeDateLocal(date);
	}

});
