const fileInput = document.getElementById('file');
if (fileInput) {
	fileInput.style.position = 'absolute';
	fileInput.style.border = 'none';
	fileInput.style.height = '0';
	fileInput.style.width = '0';
	fileInput.style.opacity = '0';
}

let hidePostsList;
let hidden = new Set(JSON.parse(localStorage.getItem('hidden')));

const setHidden = (posts, hide) => {
	if (posts && posts.length > 0) {
		for (let i = 0; i < posts.length; i++) {
			const post = posts[i];
			if (!post.dataset) {
				continue;
			}
			const menu = post.querySelector('.postmenu');
			if (menu) {
				for (let i = 0; i < menu.children.length; i++) {
					if (hide) {
						menu.children[i].innerText = 'Un'+menu.children[i].originalText;
					} else {
						menu.children[i].innerText = menu.children[i].originalText;
					}
				}
			}
			const { board, postId, userId } = post.dataset;
			if (hide) {
				post.classList.add('hidden');
			} else {
				hidden.delete(`${board}-${postId}`);
				post.classList.remove('hidden');
			}
		}
	}
}

const changeOption = function(e) {
	const option = this.value;
	const postContainer = this.parentElement.parentElement.parentElement;
	const { board, postId, userId } = postContainer.dataset;
	let posts = [postContainer];
	const hiding = !option.startsWith('Un');
	if (option.endsWith('ID')) {
		const idPosts = document.querySelectorAll(`[data-user-id="${userId}"]`);
		if (idPosts && idPosts.length > 0) {
			posts = idPosts;
		}
		if (hiding) {
			hidden.add(userId);
		} else {
			hidden.delete(userId);
		}
	}
	if (hiding) {
		hidden.add(`${board}-${postId}`);
	}
	this.value = '';
	setHidden(posts, hiding);
	const hiddenArray = [...hidden];
	hidePostsList.value = hiddenArray.toString();
	setLocalStorage('hidden', JSON.stringify(hiddenArray));
}

for (let menu of document.getElementsByClassName('postmenu')) {
	menu.value = '';
	for (let i = 0; i < menu.children.length; i++) {
		menu.children[i].originalText = menu.children[i].innerText;
	}
	menu.addEventListener('change', changeOption, false);
}

const getHiddenElems = () => {
	const posts = [];
	for (let elem of hidden) {
		if (elem.includes('-')) {
			const [board, postId] = elem.split('-');
			const post = document.querySelector(`[data-board="${board}"][data-post-id="${postId}"]`);
			if (post) {
				posts.push(post);
			}
		} else {
			const idPosts = document.querySelectorAll(`[data-user-id="${elem}"]`);
			if (idPosts && idPosts.length > 0) {
				posts = posts.concat(idPosts);
			}
		}
	}
	return posts;
}

setHidden(getHiddenElems(), true);

const renderCSSLink = document.createElement('style');
renderCSSLink.type = 'text/css';
renderCSSLink.id = 'rendercss';
document.head.appendChild(renderCSSLink);
const renderSheet = renderCSSLink.sheet;
const rulesKey = renderSheet.rules ? 'rules' : 'cssRules';

class CssToggle {
	constructor (settingId, localStorageKey, localStorageDefault, settingCss) {
		this.localStorageKey = localStorageKey;
		this.localStorageDefault = localStorageDefault;
		setDefaultLocalStorage(this.localStorageKey, this.localStorageDefault);
		this.settingBoolean = localStorage.getItem(this.localStorageKey) == 'true';
		this.settingCss = settingCss;
		window.addEventListener('settingsReady', () => {
			//on event fire, set boolean to correct checked stats
			this.setting = document.getElementById(settingId);
			this.setting.checked = this.settingBoolean;
			this.setting.addEventListener('change', () => {
				this.toggle();
			}, false);
		});
		this.apply();
	}
	toggle () {
		this.settingBoolean = !this.settingBoolean;
		console.log('toggling', this.localStorageKey, this.settingBoolean);
		this.apply();
		setLocalStorage(this.localStorageKey, this.settingBoolean);
	}
	apply () {
		if (this.settingBoolean) {
			renderSheet.insertRule(this.settingCss);
		} else {
			for (let i = 0; i < renderSheet[rulesKey].length; i++) {
				if (renderSheet[rulesKey][i].selectorText == this.settingCss.split(' {')[0]) {
					renderSheet.deleteRule(i);
				}
			}
		}
	}
};

//define the css
const hidePostStubsCss = `.post-container.hidden, .catalog-tile.hidden { visibility: hidden;margin-top: -1.5em;height: 0; }`;
const hideImagesCss = `.file-thumb, .catalog-thumb { visibility: hidden !important; }`;
const hideRecursiveCss = `.op.hidden ~ .anchor, .op.hidden ~ .post-container { display: none; }`;
const heightlimitCss = `img, video { max-height: unset; }`;
const crispCss = `img { image-rendering: crisp-edges; }`;
const nonColorIdsCss = `.user-id { background: transparent none repeat scroll 0% 0% !important; border-color: transparent; text-shadow: none; color: var(--font-color); }`;
const alwaysShowSpoilersCss = `.spoiler { color: var(--font-color) !important; background: transparent none repeat scroll 0% 0%; outline: 1px solid black; cursor: auto; }`;
//make classes with css
new CssToggle('hiderecursive-setting', 'hiderecursive', true, hideRecursiveCss);
new CssToggle('heightlimit-setting', 'heightlimit', false, heightlimitCss);
new CssToggle('crispimages-setting', 'crispimages', false, crispCss);
new CssToggle('hideimages-setting', 'hideimages', false, hideImagesCss);
new CssToggle('noncolorids-setting', 'noncolorids', false, nonColorIdsCss);
new CssToggle('alwaysshowspoilers-setting', 'alwaysshowspoilers', false, alwaysShowSpoilersCss);
new CssToggle('hidepoststubs-setting', 'hidepoststubs', false, hidePostStubsCss);

window.addEventListener('addPost', function(e) {
	const post = e.detail.post;
	const { board, postId, userId } = post.dataset;
	const hiddenKey = `${board}-${postId}`;
	if (hidden.has(hiddenKey) || hidden.has(userId)) {
		post.classList.add('hidden');
	}
	const menu = post.querySelector('.postmenu');
	for (let i = 0; i < menu.children.length; i++) {
		menu.children[i].originalText = menu.children[i].innerText;
	}
	menu.value = '';
	menu.addEventListener('change', changeOption, false);
});

window.addEventListener('settingsReady', function(e) {
	hidePostsList = document.getElementById('hiddenpostslist-setting');
	hidePostsList.value = [...hidden];
	const hidePostsListClearButton = document.getElementById('hiddenpostslist-clear');
	const clearhidePostsList = () => {
		setHidden(getHiddenElems(), false);
		hidden = new Set();
		hidePostsList.value = '';
		
setLocalStorage('hidden', '[]');
		console.log('cleared hidden posts');
	}
	hidePostsListClearButton.addEventListener('click', clearhidePostsList, false);
});

