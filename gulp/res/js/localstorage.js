
const isCatalog = window.location.pathname.endsWith('catalog.html');
const isThread = /\/\w+\/thread\/\d+.html/.test(window.location.pathname);
const isModView = /\/\w+\/manage\/(thread\/)?(index|\d+).html/.test(window.location.pathname);

function setLocalStorage(key, value) {
	try {
		localStorage.setItem(key, value);
	} catch (e) {
		deleteStartsWith();
	} finally {
		localStorage.setItem(key, value);
	}
}

function appendLocalStorageArray(key, value) {
	const storedArray = JSON.parse(localStorage.getItem(key));
	storedArray.push(value);
	setLocalStorage(key, JSON.stringify(storedArray));
}
function deleteStartsWith(startString = 'hovercache') {

	//clears hover cache when localstorage gets full
	const hoverCaches = Object.keys(localStorage).filter(k => k.startsWith(startString));
	for(let i = 0; i < hoverCaches.length; i++) {
		localStorage.removeItem(hoverCaches[i]);
	}
}

function setDefaultLocalStorage(key, value) {
	if (!localStorage.getItem(key)) {
		setLocalStorage(key, value);
	}
}

//todo: just make the localstorage name match the names of settings and put a loop
setDefaultLocalStorage('volume', settings.defaultVolume);
setDefaultLocalStorage('loop', settings.loop);
setDefaultLocalStorage('imageloadingbars', settings.imageLoadingBard);
setDefaultLocalStorage('live', settings.live);
setDefaultLocalStorage('scroll', settings.sctollToPosts);
setDefaultLocalStorage('localtime', settings.localTime);
setDefaultLocalStorage('relative', settings.relativeTime);
setDefaultLocalStorage('24hour', settings.hour24time);
setDefaultLocalStorage('notifications', settings.notificationsEnabled);
setDefaultLocalStorage('notification-yous-only', settings.notificationsYousOnly);
setDefaultLocalStorage('yous-setting', settings.showYous);

setDefaultLocalStorage('dragtop', null);
setDefaultLocalStorage('dragleft', null);
setDefaultLocalStorage('hidden', '[]');
setDefaultLocalStorage('yous', '[]');
setDefaultLocalStorage('name', '');
setDefaultLocalStorage('theme', 'default');
setDefaultLocalStorage('codetheme', 'default');
setDefaultLocalStorage('customcss', '');
