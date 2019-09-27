window.addEventListener('DOMContentLoaded', (event) => {

	const links = document.getElementsByClassName('post-quoters');
	const messageBox = document.getElementById('message');

	const addQuote = function(number) {
		messageBox.value += `>>${number}\n`;
		messageBox.scrollTop = messageBox.scrollHeight;
	}

	const quote = function(e) {
		const quoteNum = this.textContent.replace('[Reply]', '').split(' ')[0].trim();
		addQuote(quoteNum);
	};

	for (let i = 0; i < links.length; i++) {
		links[i].addEventListener('click', quote, false);
	}

	window.addEventListener('addPost', function(e) {
		const post = e.detail.post;
		const newlinks = post.getElementsByClassName('post-quoters');
		for (let i = 0; i < newlinks.length; i++) {
			newlinks[i].addEventListener('click', quote, false);
		}
	});

});
