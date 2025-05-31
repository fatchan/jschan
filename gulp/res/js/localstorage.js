/* eslint-disable no-unused-vars */
/* globals setDefaultLocalStorage settings */
const isCatalog = /^\/(\w+\/(manage\/)?)?catalog.html/.test(window.location.pathname);
const isThread = /\/\w+\/thread\/\d+.html/.test(window.location.pathname);
const isModView = /\/\w+\/manage\/(thread\/)?(index|\d+).html/.test(window.location.pathname);
const isManage = /\/(\w+\/manage|globalmanage)\/(recent|reports|bans|boards|(global)?logs|settings|banners|accounts|roles|news|filters|custompages|assets|staff).html/.test(window.location.pathname);
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
	for (let i = 0; i < hoverCaches.length; i++) {
		localStorage.removeItem(hoverCaches[i]);
	}
}

function setDefaultLocalStorage(key, value) {
	if (!localStorage.getItem(key)) {
		setLocalStorage(key, value);
	}
}

//todo: just make the localstorage name match the names of settings and put a loop
const localStorageDefaults = {
	'volume': settings.defaultVolume,
	'loop': settings.loop,
	'imageloadingbars': settings.imageLoadingBars,
	'live': settings.live,
	'scroll': settings.scrollToPosts,
	'localtime': settings.localTime,
	'relative': settings.relativeTime,
	'24hour': settings.hour24Time,
	'notifications': settings.notificationsEnabled,
	'notification-yous-only': settings.notificationsYousOnly,
	'yous-setting': settings.showYous,
	'threadwatcher': settings.threadWatcher,
	'threadwatcher-minimise': false,
	'disableboardcss': false,
	'tegakiwidth-setting': settings.tegakiWidth,
	'tegakiheight-setting': settings.tegakiHeight,
	'hoverexpandsmedia': settings.hoverExpandsMedia,
	'hoverexpandsfollowcursor': settings.hoverExpandsFollowCursor,
	'filters1': '[]',
	'yous': '[]',
	'watchlist': '[]',
	'name': '',
	'theme': 'default',
	'codetheme': 'default',
	'customcss': '',
	'overboardsettings': '{"add":"","rem":"","include_default":true}',
};

Object
	.entries(localStorageDefaults)
	.map(entry => setDefaultLocalStorage(entry[0], entry[1]));
