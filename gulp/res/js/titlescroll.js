window.addEventListener('DOMContentLoaded', (event) => {

	let focused = document.hasFocus();
	let unread = [];
	const originalTitle = document.title;

	const isVisible = (e) => {
		const top = e.getBoundingClientRect().top;
		const bottom = e.getBoundingClientRect().bottom;
		const height = window.innerHeight;
		return (top >= 0 || bottom-top > height) && bottom <= height;
	}

	const updateTitle = () => {
		if (unread.length === 0) {
			document.title = originalTitle;
		} else {
			document.title = `(${unread.length}) ${originalTitle}`;
		}
	}

	const focusChange = () => {
		focused = !focused;
	}

	const updateVisible = () => {
		unread = unread.filter(p => {
			if (isVisible(p)) {
				p.classList.remove('highlighted');
				return false;
			}
			return true;
		});
		updateTitle();
	}

	window.onfocus = () => {
		focusChange();
		updateVisible();
	}
	window.onblur = focusChange;
	window.addEventListener('scroll', updateVisible);

	window.addEventListener('addPost', function(e) {
		const post = e.detail.post;
		//if browsing another tab or the post is out of scroll view
		if (!focused || !isVisible(post)) {
			post.classList.add('highlighted');
			unread.push(post);
			updateTitle();
		}
	});

});
