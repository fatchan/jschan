setDefaultLocalStorage('notifications', false);
let notificationsEnabled = localStorage.getItem('notifications') == 'true';
setDefaultLocalStorage('notification-yous-only', false);
let notificationYousOnly = localStorage.getItem('notification-yous-only') == 'true';
setDefaultLocalStorage('yous-setting', true);
let yousEnabled = localStorage.getItem('yous-setting') == 'true';
setDefaultLocalStorage('yous', '[]');
let savedYous = new Set(JSON.parse(localStorage.getItem('yous')));

const toggleAll = () => savedYous.forEach(y => toggleOne(y));

const toggleQuotes = (quotes) => {
	quotes.forEach(q => {
		q.classList[yousEnabled?'add':'remove']('you');
	});
}

const toggleOne = (you) => {
	const [board, postId] = you.split('-');
	const post = document.querySelector(`[data-board="${board}"][data-post-id="${postId}"]`);
	if (post) {
		const postName = post.querySelector('.post-name');
		if (postName) {
			postName.classList[yousEnabled?'add':'remove']('you');
		}
	}
	const quotes = document.querySelectorAll(`.quote[href^="/${board}/"][href$="#${postId}"]`);
	if (quotes) {
		toggleQuotes(quotes);
	}
}

if (yousEnabled) {
	toggleAll();
}

window.addEventListener('addPost', (e) => {
	const postYou = `${e.detail.json.board}-${e.detail.postId}`;
	const isYou = window.myPostId == e.detail.postId
	if (isYou) {
		//save you
		savedYous.add(postYou);
		setLocalStorage('yous', JSON.stringify([...savedYous]));
	}
	if (savedYous.has(postYou)) {
		//toggle forn own post for name field
		toggleOne(postYou);
	}
	const quotesYou = e.detail.json.quotes
		.map(q => `${e.detail.json.board}-${q.postId}`)
		.filter(y => savedYous.has(y))
		.length > 0;
	const youHoverQuotes = e.detail.json.quotes
		.concat(e.detail.json.backlinks)
		.map(q => `${e.detail.json.board}-${q.postId}`)
		.filter(y => savedYous.has(y))
		.map(y => {
			const [board, postId] = y.split('-');
			return e.detail.post.querySelector(`.quote[href^="/${board}/"][href$="#${postId}"]`)
		});
	//toggle for any quotes in a new post that quote (you)
	toggleQuotes(youHoverQuotes);
	//if not a hover newpost, and enabled/for yous, send notification
	if (!e.detail.hover && notificationsEnabled && !isYou) {
		if (notificationYousOnly && !quotesYou) {
			return; //only send notif for (you) if setting
		}
		try {
			console.log('attempting to send notification', postYou);
			new Notification(`${quotesYou ? 'New quote in: ' : ''}${document.title}`, {
				body: postData.nomarkup ? postData.nomarkup.substring(0,100) : ''
			});
		} catch (e) { /* notification cant send for some reason -- user revoked perms in browser? */ }
	}
});

window.addEventListener('settingsReady', () => {

    const yousSetting = document.getElementById('yous-setting');
    const toggleYousSetting = () => {
        yousEnabled = !yousEnabled;
        setLocalStorage('yous-setting', yousEnabled);
        toggleAll();
        console.log('toggling yous', yousEnabled);
    }
    yousSetting.checked = yousEnabled;
    yousSetting.addEventListener('change', toggleYousSetting, false);

    const notificationYousOnlySetting = document.getElementById('notification-yous-only');
    const toggleNotificationYousOnlySetting = () => {
        notificationYousOnly = !notificationYousOnly;
        setLocalStorage('notification-yous-only', notificationYousOnly);
        console.log('toggling notification only for yous', yousEnabled);
    }
    notificationYousOnlySetting.checked = notificationYousOnly;
    notificationYousOnlySetting.addEventListener('change', toggleNotificationYousOnlySetting, false);

	const notificationSetting = document.getElementById('notification-setting');
	const toggleNotifications = async () => {
		notificationsEnabled = !notificationsEnabled;
		if (notificationsEnabled) {
			const result = await Notification.requestPermission()
			if (result != 'granted') {
				//user denied permission popup
				notificationsEnabled = false;
				notificationSetting.checked = false;
				return;
			}
		}
		console.log('toggling notifications', notificationsEnabled);
		setLocalStorage('notifications', notificationsEnabled);
	}
	notificationSetting.checked = notificationsEnabled;
	notificationSetting.addEventListener('change', toggleNotifications, false);

});
