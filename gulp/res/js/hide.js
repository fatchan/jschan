const fileInput = document.getElementById('file');
fileInput ? fileInput.style.display = 'none' : void 0;
let hidden;
const loadHiddenStorage = () => {
	try {
		const loaded = localStorage.getItem('hidden')
		if (loaded) {
			hidden = new Set(JSON.parse(loaded));
			return;
		}
	} catch (e) {
		console.error(e);
	}
	//set to empty if not exist or error parsing
	setLocalStorage('hidden', '[]');
	hidden = new Set();
}
loadHiddenStorage();

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
	setLocalStorage('hidden', JSON.stringify([...hidden]));
}

for (let menu of document.getElementsByClassName('postmenu')) {
	menu.value = '';
	for (let i = 0; i < menu.children.length; i++) {
		menu.children[i].originalText = menu.children[i].innerText;
	}
	menu.addEventListener('change', changeOption, false);
}

for (let elem of hidden) {
	let posts = [];
	if (elem.includes('-')) {
		const [board, postId] = elem.split('-');
		const post = document.querySelector(`[data-board="${board}"][data-post-id="${postId}"]`);
		if (post) {
			posts.push(post);
		}
	} else {
		const idPosts = document.querySelectorAll(`[data-user-id="${elem}"]`);
		if (idPosts && idPosts.length > 0) {
			posts = idPosts;
		}
	}
	setHidden(posts, true);
}

const renderCSSLink = document.createElement('style');
renderCSSLink.type = 'text/css';
renderCSSLink.id = 'rendercss';
document.head.appendChild(renderCSSLink);
const renderSheet = renderCSSLink.sheet;
const rulesKey = renderSheet.rules ? 'rules' : 'cssRules';

class CssToggle {
	constructor (settingId, localStorageKey, settingCss) {
		this.localStorageKey = localStorageKey;
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
		this.toggle();
	}
	toggle () {
		this.settingBoolean = !this.settingBoolean;
		if (this.settingBoolean) {
	        renderSheet.insertRule(this.settingCss);
	    } else {
	        for (let i = 0; i < renderSheet[rulesKey].length; i++) {
	            if (renderSheet[rulesKey][i].cssText == this.settingCss) {
	                renderSheet.deleteRule(i);
	            }
	        }
	    }
		console.log('toggling', this.localStorageKey, this.settingBoolean);
		setLocalStorage(this.localStorageKey, this.settingBoolean);
	}
};

//det localstorage defaults
// setDefaultLocalStorage('hidestubs', false);
setDefaultLocalStorage('hiderecursive', false);
setDefaultLocalStorage('hideimages', false);
setDefaultLocalStorage('crispimages', false);
setDefaultLocalStorage('heightlimit', false);

//define the css
//const hideStubsCss = `.post-container.hidden, .catalog-tile.hidden { visibility: hidden;margin-top: -1.5em;height: 0; }`;
const hideImagesCss = `.file-thumb { visibility: hidden !important; }`
const hideRecursiveCss = `.op.hidden ~ .anchor, .op.hidden ~ .post-container { display: none; }`;
const heightlimitCss = `img, video { max-height: unset; }`;
const crispCss = `img { image-rendering: crisp-edges; }`;

//make classes with css
//new CssToggle('hidestubs-setting', 'hidestubs', hideStubsCss);
new CssToggle('hiderecursive-setting', 'hiderecursive', hideRecursiveCss);
new CssToggle('heightlimit-setting', 'heightlimit', heightlimitCss);
new CssToggle('crispimages-setting', 'crispimages', crispCss);
new CssToggle('hideimages-setting', 'hideimages', hideImagesCss);

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
