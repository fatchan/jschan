window.addEventListener('DOMContentLoaded', (event) => {

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
		localStorage.setItem('hidden', '[]');
		hidden = new Set();
	}

	loadHiddenStorage();

	const saveHiddenStorage = () => {
		localStorage.setItem('hidden', JSON.stringify([...hidden]));
	}

	for (let id of hidden) {
		document.getElementById(id).nextSibling.classList.add('hidden');
	}

	const menus = document.getElementsByClassName('postmenu');

	const toggleHide = function(e) {
//TODO: make the IDs per-board, get board name as part of string too
		const postContainer = this.parentElement.parentElement.parentElement;
		const postId = this.parentElement.firstChild.href.split('#')[1]
		postContainer.classList.toggle('hidden');
		if (postContainer.classList.contains('hidden')) {
			hidden.add(postId);
		} else {
			hidden.delete(postId);
		}
		saveHiddenStorage();
	};

	for (let i = 0; i < menus.length; i++) {
		menus[i].addEventListener('click', toggleHide, false);
	}

	window.addEventListener('addPost', function(e) {
		const post = e.detail.post;
		const newmenu = post.getElementsByClassName('postmenu');
		newmenu[0].addEventListener('click', toggleHide, false);
	});


});
