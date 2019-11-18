window.addEventListener('DOMContentLoaded', (event) => {

	const quotes = document.getElementsByClassName('quote');

	const isVisible = (e) => {
		const top = e.getBoundingClientRect().top;
		const bottom = e.getBoundingClientRect().bottom;
		const height = window.innerHeight;
		return top >= 0 && bottom <= height;
	}

	const setFloatPos = (float, xpos, ypos) => {
		const post = float.firstChild;
		const iw = document.body.offsetWidth-10;
		const ih = window.innerHeight;
		const left = xpos < iw/2;
		if (left) {
			float.style.left = `${xpos+10}px`;
			if (xpos+post.offsetWidth >= iw) {
				float.style.right = '5px';
			}
		} else {
			float.style.right = `${iw-xpos+10}px`;
			if (xpos-post.offsetWidth <= 0) {
				float.style.left = '5px';
			}
		}
		const top = ypos < ih/2;
		if (top && ypos+post.offsetHeight < ih) {
			float.style.top = `${ypos+10}px`;
		} else if (!top && post.offsetHeight < ypos) {
			float.style.top = `${ypos-post.offsetHeight-10}px`;
		} else {
			float.style.top = '42px';
		}
	}

	const floatPost = (post, xpos, ypos) => {
		const clone = document.createElement('div');
		clone.id = 'float';
		clone.appendChild(post.cloneNode(true));
		document.body.appendChild(clone);
		setFloatPos(clone, xpos, ypos);
	};

	const moveHighlightPost = (e) => {
		const float = document.getElementById('float');
		if (float != null) {
			setFloatPos(float, e.clientX, e.clientY);
		}
	}

	const toggleHighlightPost = function(e) {
		const float = document.getElementById('float');
		if (float != null) {
			return document.body.removeChild(float);
		}
		if (!this.hash) {
			return; //non-post number board quote
		}
		const hash = this.hash.substring(1);
		const anchor = document.getElementById(hash);
		if (!anchor) {
			return;
//TODO: fetch posts from json api here for post hovering, build with post modal template and call floatPost
		}
		const post = anchor.nextSibling;
		if (isVisible(post)) {
			post.classList.toggle('highlighted');
		} else {
			floatPost(post, e.clientX, e.clientY);
		}
	};

	for (let i = 0; i < quotes.length; i++) {
		quotes[i].addEventListener('mouseover', toggleHighlightPost, false);
		quotes[i].addEventListener('mouseout', toggleHighlightPost, false);
//		quotes[i].addEventListener('mousemove', moveHighlightPost, false);
	}

	window.addEventListener('addPost', function(e) {
		const post = e.detail.post;
		//const newquotes = post.getElementsByClassName('quote');
		const newquotes = document.getElementsByClassName('quote'); //to get backlinks from replying posts. just an easy way. could make more efficient and only do necessary ones later.
		for (let i = 0; i < newquotes.length; i++) {
			newquotes[i].removeEventListener('mouseover', toggleHighlightPost);
			newquotes[i].removeEventListener('mouseout', toggleHighlightPost);
//			newquotes[i].removeEventListener('mousemove', moveHighlightPost);
			newquotes[i].addEventListener('mouseover', toggleHighlightPost, false);
			newquotes[i].addEventListener('mouseout', toggleHighlightPost, false);
//			newquotes[i].addEventListener('mousemove', moveHighlightPost, false);
		}
	});


});
