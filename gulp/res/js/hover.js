window.addEventListener('DOMContentLoaded', (event) => {

	var quotes = document.getElementsByClassName('quote');

	var toggleHighlightPost = function(e) {
		var hash = this.hash.substring(1);
		var anchor = document.getElementById(hash);
		var post = anchor.nextSibling;
		post.classList.toggle('highlighted');
	};

	for (var i = 0; i < quotes.length; i++) {
		quotes[i].addEventListener('mouseover', toggleHighlightPost, false);
		quotes[i].addEventListener('mouseout', toggleHighlightPost, false);
	}

});
