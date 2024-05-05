/* globals isThread setLocalStorage */
window.addEventListener('DOMContentLoaded', () => {

	const postForm = document.querySelector('#postform');
	const topPostButton = document.querySelector('a[href="#postform"]');
	const bottomPostButton = document.querySelector('.bottom-reply');
	const messageBox = document.getElementById('message');

	const openPostForm = (e) => {
		if (e) {
			e.preventDefault();
		}
		if (!postForm) {
			return;
		}
		history.replaceState({}, '', '#postform');
		postForm.style.display = 'flex';
		topPostButton.style.visibility = 'hidden';
		if (bottomPostButton) {
			bottomPostButton.style.display = 'none';
		}
		if (messageBox) {
			messageBox.focus();
		}
		postForm.dispatchEvent(new Event('opened'));
	};
	const closePostForm = (e) => {
		e.preventDefault();
		history.replaceState({}, '', location.pathname);
		postForm.style.display = 'none';
		topPostButton.style.visibility = 'visible';
		if (bottomPostButton) {
			bottomPostButton.style.display = '';
		}
	};
	if (postForm) {
		const closeButton = postForm ? postForm.querySelector('.close') : null;
		topPostButton.addEventListener('click', openPostForm, false);
		if (bottomPostButton) {
			bottomPostButton.addEventListener('click', openPostForm, false);
		}
		closeButton.addEventListener('click', closePostForm, false);
	}

	const addToMessageBox = (str) => {
		const index = messageBox.selectionStart;
		messageBox.value = `${messageBox.value.substr(0,index)}${str}${messageBox.value.substr(index)}`;
		messageBox.setSelectionRange(index+str.length, index+str.length); //this scroll anyway, no need to set scrolltop
	};

	const addQuote = function(number) {
		let quoteText = `>>${number}\n`;
		let selection;
		if (window.getSelection) {
			selection = window.getSelection().toString();
		} else if (document.getSelection) {
			selection = document.getSelection().toString();
		} else if (document.selection) {
			selection = document.selection.createRange().text;
		}
		if (selection && selection.length > 0) {
			const quotedSelection = selection.split(/\r?\n/) //split by lines
				.map(line => line.trim().length > 0 ? `>${line}` : line) //make non empty lines greentext
				.join('\n'); //join it back together and newline
			quoteText += `${quotedSelection}\n`;
		}
		openPostForm();
		addToMessageBox(quoteText);
		messageBox.focus();
		messageBox.dispatchEvent(new Event('input'));
	};

	const quote = function(e) {
		const quoteNum = this.textContent.trim();
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
