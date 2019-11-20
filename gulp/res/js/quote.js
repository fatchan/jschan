window.addEventListener('DOMContentLoaded', (event) => {

	const isThread = /\/\w+\/thread\/\d+.html/.test(window.location.pathname);
	const links = document.getElementsByClassName('post-quoters');
	const messageBox = document.getElementById('message');

	const addQuote = function(number) {
		window.location.hash = 'postform'; //open postform
		messageBox.value += `>>${number}\n`;
		messageBox.scrollTop = messageBox.scrollHeight;
		messageBox.focus();
		messageBox.setSelectionRange(messageBox.value.length, messageBox.value.length);
	}

	const quote = function(e) {
		e.preventDefault();
		const quoteNum = this.textContent.replace('[Reply]', '').split(' ')[0].trim();
		if (isThread) {
			addQuote(quoteNum);
		} else {
			setLocalStorage('clickedQuote', quoteNum);
			window.location = this.firstChild.href.replace(/#postform$/, '#'+quoteNum);
		}
	};

	//on loading page after clicking quote
	if (isThread) {
		const quoteNum = localStorage.getItem('clickedQuote');
		if (quoteNum != null) {
			addQuote(quoteNum);
		}
		localStorage.removeItem('clickedQuote');
	}

	for (let i = 0; i < links.length; i++) {
		links[i].addEventListener('click', quote, false);
	}

	window.addEventListener('addPost', function(e) {
		if (e.detail.hover) {
			return; //dont need to handle hovered posts for this
		}
		const post = e.detail.post;
		const newlinks = post.getElementsByClassName('post-quoters');
		for (let i = 0; i < newlinks.length; i++) {
			newlinks[i].addEventListener('click', quote, false);
		}
	});

});
