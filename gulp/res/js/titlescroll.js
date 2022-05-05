window.addEventListener('DOMContentLoaded', () => {

	let focused = document.hasFocus();
	let unread = [];
	const originalTitle = document.title;

	/*const changeFavicon = (href) => {
		const currentFav = document.head.querySelector('link[type="image/x-icon"]');
		const newFav = document.createElement('link');
		newFav.type = 'image/x-icon';
		newFav.rel = 'shortcut icon';
		newFav.href = href;
		currentFav.remove();
		document.head.appendChild(newFav);
	};*/

	const isVisible = (e) => {
		const top = e.getBoundingClientRect().top;
		const bottom = e.getBoundingClientRect().bottom;
		const height = window.innerHeight;
		return (top >= 0 || bottom-top > height) && bottom <= height;
	};

	const updateTitle = () => {
		if (unread.length === 0) {
			document.title = originalTitle;
		} else {
			document.title = `(${unread.length}) ${originalTitle}`;
		}
	};

	const focusChange = () => {
		focused = !focused;
	};

	const updateVisible = () => {
		const unreadBefore = unread.length;
		unread = unread.filter(p => {
			if (isVisible(p)) {
				p.classList.remove('highlighted');
				return false;
			}
			return true;
		});
		if (unreadBefore !== unread.length) {
			updateTitle();
		}
	};

	window.addEventListener('focus', focusChange);
	window.addEventListener('blur', focusChange);
	window.addEventListener('scroll', updateVisible);

	window.addEventListener('addPost', function(e) {
		if (e.detail.hover) {
			return; //dont need to handle hovered posts for this
		}
		const post = e.detail.post;
		//if browsing another tab or the post is out of scroll view
		if (!focused || !isVisible(post)) {
			post.classList.add('highlighted');
			unread.push(post);
			updateTitle();
		}
	});

});
