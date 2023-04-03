/* globals __ setLocalStorage */
let notificationsEnabled = localStorage.getItem('notifications') == 'true';
let notificationYousOnly = localStorage.getItem('notification-yous-only') == 'true';
let yousEnabled = localStorage.getItem('yous-setting') == 'true';
let savedYous = new Set(JSON.parse(localStorage.getItem('yous')));
let yousList;

const toggleAllYous = (state) => savedYous.forEach(y => toggleOne(y, state));

const toggleQuotes = (quotes, state) => {
	quotes.forEach(q => {
		q[state?'setAttribute':'removeAttribute']('data-label', __('You'));
		q.classList[state?'add':'remove']('you');
	});
};

const toggleOne = (you, state) => {
	const [board, postId] = you.split('-');
	const post = document.querySelector(`[data-board="${board}"][data-post-id="${postId}"]`);
	if (post) {
		const postName = post.querySelector('.post-name');
		if (postName) {
			postName[state?'setAttribute':'removeAttribute']('data-label', __('You'));
			postName.classList[state?'add':'remove']('you');
		}
	}
	const quotes = document.querySelectorAll(`.quote[href^="/${board}/"][href$="#${postId}"]`);
	if (quotes) {
		toggleQuotes(quotes, state);
	}
};

const formatNotificationOptions = (postData) => {
	const notificationOptions = {
		body: postData.nomarkup ? postData.nomarkup.substring(0,100) : ''
	};
	if (postData.files.length > 0) {
		//tries to use a thumb instead of full files, will be lighter on bandwidth and able to show for video and some audio too
		let notificationImageURL;
		const spoilerNotification = (postData.spoiler || postData.files.some(f => f.spoiler === true));
		const notificationFile = postData.files.find(f => (!f.spoiler && (f.hasThumb === true || f.mimetype.startsWith('image/'))));
		if (spoilerNotification && !notificationFile) {
			notificationImageURL = '/file/spoiler.png';
		} else {
			if (notificationFile) {
				if (notificationFile.hasThumb) {
					notificationImageURL = `/file/thumb/${notificationFile.hash}${notificationFile.thumbextension}`;
				} else {
					notificationImageURL = `/file/${notificationFile.filename}`;
				}
			}
		}
		if (notificationImageURL) {
			notificationOptions.image = notificationImageURL;
			notificationOptions.badge = notificationImageURL;
			notificationOptions.icon = notificationImageURL;
		}
	}
	return notificationOptions;
};

if (yousEnabled) {
	toggleAllYous(yousEnabled);
}

const handleNewYous = (e) => {
	const postYou = `${e.detail.json.board}-${e.detail.postId}`;
	const isYou = window.myPostId == e.detail.postId;
	if (isYou) {
		//save you
		savedYous.add(postYou);
		const arrayYous = [...savedYous];
		yousList.value = arrayYous.toString();
		setLocalStorage('yous', JSON.stringify(arrayYous));
	}
	if (savedYous.has(postYou)) {
		//toggle forn own post for name field
		toggleOne(postYou, yousEnabled);
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
			return e.detail.post.querySelectorAll(`.quote[href^="/${board}/"][href$="#${postId}"]`);
		}).reduce((acc, array) => {
			return acc.concat(Array.from(array)); //handle duplicate of same quote
		}, []);
	//toggle for any quotes in a new post that quote (you)
	toggleQuotes(youHoverQuotes, yousEnabled);
	//if not a hover newpost, and enabled/for yous, send notification
	if (!e.detail.nonotify && !e.detail.hover && notificationsEnabled && !isYou) {
		if (notificationYousOnly && !quotesYou) {
			return; //only send notif for (you) if setting
		}
		try {
			console.log('attempting to send notification', postYou);
			const postData = e.detail.json;
			const notificationOptions = formatNotificationOptions(postData);
			new Notification(`${quotesYou ? 'New quote in: ' : ''}${document.title}`, notificationOptions);
		} catch (e) {
			// notification cant send for some reason -- user revoked perms in browser?
			console.log('failed to send notification', e);
		}
	}
};

window.addEventListener('addPost', handleNewYous, false);
window.addEventListener('updatePostMessage', handleNewYous, false);

window.addEventListener('settingsReady', () => {

	yousList = document.getElementById('youslist-setting');
	yousList.value = [...savedYous];
	const yousListClearButton = document.getElementById('youslist-clear');
	const clearYousList = () => {
		if (yousEnabled) {
			toggleAllYous(false);
		}
		savedYous = new Set();
		yousList.value = '';
		setLocalStorage('yous', '[]');
		console.log('cleared yous');
	};
	yousListClearButton.addEventListener('click', clearYousList, false);

	const yousSetting = document.getElementById('yous-setting');
	const toggleYousSetting = () => {
		yousEnabled = !yousEnabled;
		setLocalStorage('yous-setting', yousEnabled);
		toggleAllYous(yousEnabled);
		console.log('toggling yous', yousEnabled);
	};
	yousSetting.checked = yousEnabled;
	yousSetting.addEventListener('change', toggleYousSetting, false);

	const notificationYousOnlySetting = document.getElementById('notification-yous-only');
	const toggleNotificationYousOnlySetting = () => {
		notificationYousOnly = !notificationYousOnly;
		setLocalStorage('notification-yous-only', notificationYousOnly);
		console.log('toggling notification only for yous', yousEnabled);
	};
	notificationYousOnlySetting.checked = notificationYousOnly;
	notificationYousOnlySetting.addEventListener('change', toggleNotificationYousOnlySetting, false);

	const notificationSetting = document.getElementById('notification-setting');
	const toggleNotifications = async () => {
		notificationsEnabled = !notificationsEnabled;
		if (notificationsEnabled) {
			const result = await Notification.requestPermission();
			if (result != 'granted') {
				//user denied permission popup
				notificationsEnabled = false;
				notificationSetting.checked = false;
				return;
			}
		}
		console.log('toggling notifications', notificationsEnabled);
		setLocalStorage('notifications', notificationsEnabled);
	};
	notificationSetting.checked = notificationsEnabled;
	notificationSetting.addEventListener('change', toggleNotifications, false);

});
