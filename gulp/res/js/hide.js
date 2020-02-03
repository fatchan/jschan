/*
setDefaultLocalStorage('hidestubs', false);
let hideStubsEnabled = localStorage.getItem('hidestubs') == 'true';
*/
setDefaultLocalStorage('hiderecursive', false);
let hideRecursiveEnabled = localStorage.getItem('hiderecursive') == 'true';
setDefaultLocalStorage('hideimages', false);
let hideImagesEnabled = localStorage.getItem('hideimages') == 'true';

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
		//ignore
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

const hideImages = () => {
	const postThumbs = document.getElementsByClassName('file-thumb');
	for (thumb of postThumbs) {
		thumb.classList.toggle('invisible');
	}
}
if (hideImagesEnabled) {
	hideImages();
}


window.addEventListener('settingsReady', function(event) {

	const mainStyleSheet = document.querySelector('link[rel="stylesheet"]').sheet;
	const replaceCssRule = (selectorText, css) => {
	    const rulesKey = mainStyleSheet.rules != null ? 'rules' : 'cssRules';
	    for (let i = 0; i < mainStyleSheet[rulesKey].length; i++) {
			const rule = mainStyleSheet[rulesKey][i];
	        if(rule.selectorText == selectorText) {
				mainStyleSheet.removeRule(i);
				return;
	        }
		}
		mainStyleSheet.insertRule(css);
		return;
	}

	const hideRecursiveCss = `.op.hidden ~ .anchor, .op.hidden ~ .post-container {
		display: none;
	}`;
	const hideRecursiveSetting = document.getElementById('hiderecursive-setting');
	hideRecursiveSetting.checked = hideRecursiveEnabled;
	hideRecursiveEnabled && replaceCssRule('.post-container.hidden, .catalog-tile.hidden', hideRecursiveCss);
	const toggleHideRecursive = () => {
		hideRecursiveEnabled = !hideRecursiveEnabled;
		replaceCssRule('.op.hidden ~ .anchor, .op.hidden ~ .post-container', hideRecursiveCss);
		console.log('toggling recursive hide', hideRecursiveEnabled);
		setLocalStorage('hiderecursive', hideRecursiveEnabled);
	}
	hideRecursiveSetting.addEventListener('change', toggleHideRecursive, false);

/*
	const hideStubsCss = `.post-container.hidden, .catalog-tile.hidden {
		visibility: hidden;
		margin-top: -1.5em;
		height: 0;
	}`;
	const hideStubsSetting = document.getElementById('hidestubs-setting');
	hideStubsSetting.checked = hideStubsEnabled;
	hideStubsEnabled && replaceCssRule('.post-container.hidden, .catalog-tile.hidden', hideStubsCss);
	const toggleHideStubs = () => {
		hideStubsEnabled = !hideStubsEnabled;
		replaceCssRule('.post-container.hidden, .catalog-tile.hidden', hideStubsCss);
		console.log('toggling hiding stubs', hideStubsEnabled);
		setLocalStorage('hidestubs', hideStubsEnabled);
	}
	hideStubsSetting.addEventListener('change', toggleHideStubs, false);
*/

	const crispSetting = document.getElementById('crispimages-setting');
	let crispEnabled = localStorage.getItem('crispimages') == 'true';
	const normCss = 'img{image-rendering:auto}';
	const crispCss = `img{
		image-rendering: crisp-edges;
		image-rendering: pixelated;
		image-rendering: -webkit-optimize-contrast;
		-ms-interpolation-mode: nearest-neighbor;
	}`;
	replaceCssRule('img', crispEnabled ? crispCss : normCss);
	const changeCrispSetting = (change) => {
		crispEnabled = crispSetting.checked;
		replaceCssRule('img', crispEnabled ? crispCss : normCss);
		console.log('setting images crisp', crispEnabled);
		setLocalStorage('crispimages', crispEnabled);
	}
	crispSetting.checked = crispEnabled;
	crispSetting.addEventListener('change', changeCrispSetting, false);

//todo: option here and in modal for clearing hide list and unhide all hidden posts
	const hideImagesSetting = document.getElementById('hideimages-setting');
	hideImagesSetting.checked = hideImagesEnabled;
	const toggleHideImages = () => {
		hideImagesEnabled = !hideImagesEnabled
		setLocalStorage('hideimages', hideImagesEnabled);
		hideImages();
	}
	hideImagesSetting.addEventListener('change', toggleHideImages, false);

});

window.addEventListener('addPost', function(e) {
	const post = e.detail.post;
	const { board, postId, userId } = post.dataset;
	const hiddenKey = `${board}-${postId}`;
	if (hidden.has(hiddenKey) || hidden.has(userId)) {
		post.classList.add('hidden');
	}
	if (hideImagesEnabled) {
		for (thumb of post.querySelectorAll('.file-thumb')) {
			thumb.classList.add('invisible');
		}
	}
	const menu = post.querySelector('.postmenu');
	for (let i = 0; i < menu.children.length; i++) {
		menu.children[i].originalText = menu.children[i].innerText;
	}
	menu.value = '';
	menu.addEventListener('change', changeOption, false);
});
