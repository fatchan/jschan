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
		post.classList.toggle('highlighted');
	};

	for (let i = 0; i < quotes.length; i++) {
		quotes[i].addEventListener('mouseover', toggleHighlightPost, false);
		quotes[i].addEventListener('mouseout', toggleHighlightPost, false);
	}

});
