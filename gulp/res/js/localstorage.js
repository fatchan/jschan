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

//position of floating postform
setDefaultLocalStorage('dragtop', null);
setDefaultLocalStorage('dragleft', null);
//audio/video volume percentage
setDefaultLocalStorage('volume', 100);
//whether to loop audio/video
setDefaultLocalStorage('loop', false);
//show loading bars on images
setDefaultLocalStorage('imageloadingbars', false);
//list of hidden posts in <board>-<id> format
setDefaultLocalStorage('hidden', '[]');
//connect to websocket for live posts
setDefaultLocalStorage('live', true);
//scroll to new posts
setDefaultLocalStorage('scroll', false);
//default post name
setDefaultLocalStorage('name', '');
//defualt theme, 'deault' for board theme
setDefaultLocalStorage('theme', 'default');
//defualt theme, 'deault' for board theme
setDefaultLocalStorage('codetheme', 'default');
//custom css string
setDefaultLocalStorage('customcss', '');
//show local times
setDefaultLocalStorage('localtime', true);
//relative time mode
setDefaultLocalStorage('relative', true);
//24 hour time mode
setDefaultLocalStorage('24hour', false);
//notification for new posts
setDefaultLocalStorage('notifications', false);
//notifications only for yous, requires notifications enabled
setDefaultLocalStorage('notification-yous-only', false);
//show (you)'s
setDefaultLocalStorage('yous-setting', true);
//list of yous in <board>-<id> format
setDefaultLocalStorage('yous', '[]');
