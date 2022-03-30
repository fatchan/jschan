const isCatalog = /^\/(\w+\/(manage\/)?)?catalog.html/.test(window.location.pathname);
const isThread = /\/\w+\/thread\/\d+.html/.test(window.location.pathname);
const isModView = /\/\w+\/manage\/(thread\/)?(index|\d+).html/.test(window.location.pathname);
const isManage = /\/(\w+\/manage|globalmanage)\/(recent|reports|bans|boards|logs|settings|banners|accounts|news|custompages).html/.test(window.location.pathname);
const isGlobalRecent = window.location.pathname === '/globalmanage/recent.html';
const isRecent = isGlobalRecent || window.location.pathname.endsWith('/manage/recent.html');

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

function deleteStartsWith(startString='hovercache') {
	//clears cache when localstorage gets full
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
setDefaultLocalStorage('imageloadingbars', settings.imageLoadingBars);
setDefaultLocalStorage('live', settings.live);
setDefaultLocalStorage('scroll', settings.scrollToPosts);
setDefaultLocalStorage('localtime', settings.localTime);
setDefaultLocalStorage('relative', settings.relativeTime);
setDefaultLocalStorage('24hour', settings.hour24Time);
setDefaultLocalStorage('notifications', settings.notificationsEnabled);
setDefaultLocalStorage('notification-yous-only', settings.notificationsYousOnly);
setDefaultLocalStorage('yous-setting', settings.showYous);
setDefaultLocalStorage('threadwatcher', settings.threadWatcher);
setDefaultLocalStorage('threadwatcher-minimise', false);
setDefaultLocalStorage('disableboardcss', false);
setDefaultLocalStorage('tegakiwidth-setting', settings.tegakiWidth);
setDefaultLocalStorage('tegakiheight-setting', settings.tegakiHeight);

setDefaultLocalStorage('filters1', '[]');
setDefaultLocalStorage('yous', '[]');
setDefaultLocalStorage('watchlist', '[]');
setDefaultLocalStorage('name', '');
setDefaultLocalStorage('theme', 'default');
setDefaultLocalStorage('codetheme', 'default');
setDefaultLocalStorage('customcss', '');
setDefaultLocalStorage('overboardsettings', '{"add":"","rem":"","include_default":true}');
