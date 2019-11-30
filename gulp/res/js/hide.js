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

window.addEventListener('settingsReady', function(event) {

	//add option here and in modal compiledclient for clearing hide list and unhide all hidden posts

});
