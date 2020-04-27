window.addEventListener('DOMContentLoaded', (event) => {

	const postForm = document.querySelector('#postform');
	const newPostButton = document.querySelector('a[href="#postform"]');
	const openPostForm = (e) => {
		if (e) {
			e.preventDefault();
		}
		history.replaceState({}, '', '#postform');
		postForm.style.display = 'flex';
		newPostButton.style.visibility = 'hidden';
		postForm.dispatchEvent(new Event('opened'));
	};
	const closePostForm = (e) => {
		e.preventDefault();
		history.replaceState({}, '', location.pathname);
		postForm.style.display = 'none';
		newPostButton.style.visibility = 'visible';
	};
	if (postForm) {
		const closeButton = postForm ? postForm.querySelector('.close') : null;
		newPostButton.addEventListener('click', openPostForm, false);
		closeButton.addEventListener('click', closePostForm, false);
	}

	const messageBox = document.getElementById('message');

	const addQuote = function(number) {
		openPostForm();
		messageBox.value += `>>${number}\n`;
		if (window.getSelection) {
			messageBox.value += window.getSelection();
		} else if (document.getSelection) {
			messageBox.value += document.getSelection();
		} else if (document.selection) {
			messageBox.value += document.selection.createRange().text;
		}
		messageBox.scrollTop = messageBox.scrollHeight;
		messageBox.focus();
		messageBox.setSelectionRange(messageBox.value.length, messageBox.value.length);
		messageBox.dispatchEvent(new Event('input'));
	}

	const quote = function(e) {
		const quoteNum = this.textContent.replace('[Reply]', '').split(' ')[0].trim();
		if (isThread && !e.ctrlKey) {
			addQuote(quoteNum);
		} else {
			setLocalStorage('clickedQuote', quoteNum);
		}
	};

	//on loading page open with js method if user has scripts
	if (location.hash === '#postform') {
		openPostForm();
	}
	if (isThread) {
		//add quote to postform if link clicked with quote
		const quoteNum = localStorage.getItem('clickedQuote');
		if (quoteNum != null) {
			addQuote(quoteNum);
			//scroll to the post you quoted
			const quotingPost = document.getElementById(quoteNum);
			if (quotingPost) {
				quotingPost.scrollIntoView();
			}
		}
		localStorage.removeItem('clickedQuote');
	}

	const addQuoteListeners = (l) => {
		for (let i = 0; i < l.length; i++) {
			l[i].addEventListener('click', quote, false);
		}
	};

	const links = document.getElementsByClassName('post-quoters');
	addQuoteListeners(links);

	window.addEventListener('addPost', function(e) {
		if (e.detail.hover) {
			return; //dont need to handle hovered posts for this
		}
		const post = e.detail.post;
		const newlinks = post.getElementsByClassName('post-quoters');
		addQuoteListeners(newlinks);
	});

});
