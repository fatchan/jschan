window.addEventListener('DOMContentLoaded', (event) => {

	const quotes = document.getElementsByClassName('quote');

	const toggleHighlightPost = function(e) {
		if (!this.hash) {
			return; //non-post number board quote
		}
		const hash = this.hash.substring(1);
		const anchor = document.getElementById(hash);
		if (!anchor) {
			return; //cross(board) quotes
		}
		const post = anchor.nextSibling;
		if (location.hash.substring(1) !== hash) {
			//dont toggle highlight post if its already highlighted from being the url hash
			post.classList.toggle('highlighted');
		}
	};

	for (let i = 0; i < quotes.length; i++) {
		quotes[i].addEventListener('mouseover', toggleHighlightPost, false);
		quotes[i].addEventListener('mouseout', toggleHighlightPost, false);
	}

	window.addEventListener('addPost', function(e) {
		const post = e.detail.post;
		//const newquotes = post.getElementsByClassName('quote');
		const newquotes = document.getElementsByClassName('quote'); //to get backlinks from replying posts. just an easy way. could make more efficient and only do necessary ones later.
		for (let i = 0; i < newquotes.length; i++) {
			newquotes[i].removeEventListener('mouseover', toggleHighlightPost);
			newquotes[i].removeEventListener('mouseout', toggleHighlightPost);
			newquotes[i].addEventListener('mouseover', toggleHighlightPost, false);
			newquotes[i].addEventListener('mouseout', toggleHighlightPost, false);
		}
	});


});
