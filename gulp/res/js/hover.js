window.addEventListener('DOMContentLoaded', (event) => {

	const quotes = document.getElementsByClassName('quote');
	let hoverLoading = {};
	let hovering = false;
	let lastHover;

	const toggleDottedUnderlines = (hoveredPost, id) => {
		let uniqueQuotes = new Set();
		hoveredPost.querySelectorAll('.post-message .quote').forEach(q => uniqueQuotes.add(q.href));
		if (uniqueQuotes.size > 1) {
			const matchingQuotes = hoveredPost.querySelectorAll(`.post-message .quote[href$="${id}"]`);
			for (let i = 0; i < matchingQuotes.length; i++) {
				const mq = matchingQuotes[i];
				mq.style.borderBottom = mq.style.borderBottom == '' ? '1px dashed' : '';
				mq.style.textDecoration = mq.style.textDecoration == '' ? 'none' : '';
			}
		}
	}

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

	const toggleHighlightPost = async function(e) {
		hovering = e.type === 'mouseover';
		const jsonPath = this.pathname.replace(/html$/, 'json');
		if (!this.hash) {
			return; //non-post number board quote
		}
		const float = document.getElementById('float');
		if (float) {
			document.body.removeChild(float);
		}
		const thisId = this.closest('.post-container').dataset.postId;
		const loading = Date.now();
		lastHover = loading;
		const hash = this.hash.substring(1);
		const anchor = document.getElementById(hash);
		let hoveredPost;
		if (anchor) {
			hoveredPost = anchor.nextSibling;
		} else {
			let hovercache = localStorage.getItem(`hovercache-${jsonPath}`);
			let threadJson;
			let postJson;
			if (hovercache) {
				hovercache = JSON.parse(hovercache);
				const highestId = Math.max(hovercache.postId, hovercache.replies[hovercache.replies.length-1].postId);
				if (highestId && highestId >= hash) {
					//post already in our cache
					threadJson = hovercache;
				}
			}
			if (!threadJson) {
				this.style.cursor = 'wait';
				let json;
				try {
					if (!hoverLoading[jsonPath]) {
						hoverLoading[jsonPath] = fetch(jsonPath).then(res => res.json());
					}
					json = await hoverLoading[jsonPath];
				} catch (e) {
					return console.error(e);
				} finally {
					this.style.cursor = '';
				}
				if (json) {
					threadJson = json;
					setLocalStorage(`hovercache-${jsonPath}`, JSON.stringify(threadJson));
				} else {
					return localStorage.removeItem(`hovercache-${jsonPath}`); //thread deleted
				}
			}
			if (!hovering || lastHover !== loading) {
				return; //dont show for ones not hovering
			}
			if (threadJson.postId == hash) {
				postJson = threadJson;
			} else {
				postJson = threadJson.replies.find(r => r.postId == hash);
			}
			if (!postJson) {
				return; //post was deleted or missing for some reason
			}
			const postHtml = post({ post: postJson });
			const wrap = document.createElement('div');
			wrap.innerHTML = postHtml;
			hoveredPost = wrap.firstChild.nextSibling;
			//need this event so handlers like post hiding still apply to hover introduced posts
			const newPostEvent = new CustomEvent('addPost', {
                detail: {
                    post: hoveredPost,
                    postId: postJson.postId,
					hover: true
                }
            });
            window.dispatchEvent(newPostEvent);
		}
		toggleDottedUnderlines(hoveredPost, thisId);
		if (anchor && isVisible(hoveredPost)) {
			hoveredPost.classList.toggle('highlighted');
		} else if (hovering) {
			floatPost(hoveredPost, e.clientX, e.clientY);
		}
	}

	for (let i = 0; i < quotes.length; i++) {
		quotes[i].addEventListener('mouseover', toggleHighlightPost, false);
		quotes[i].addEventListener('mouseout', toggleHighlightPost, false);
		quotes[i].addEventListener('mousemove', moveHighlightPost, false);
	}

	window.addEventListener('addPost', function(e) {
		if (e.detail.hover) {
			return; //dont need to handle hovered posts for this
		}
		const post = e.detail.post;
		//const newquotes = post.getElementsByClassName('quote');
		const newquotes = document.getElementsByClassName('quote'); //to get backlinks from replying posts. just an easy way. could make more efficient and only do necessary ones later.
		for (let i = 0; i < newquotes.length; i++) {
			newquotes[i].removeEventListener('mouseover', toggleHighlightPost);
			newquotes[i].removeEventListener('mouseout', toggleHighlightPost);
			newquotes[i].removeEventListener('mousemove', moveHighlightPost);
			newquotes[i].addEventListener('mouseover', toggleHighlightPost, false);
			newquotes[i].addEventListener('mouseout', toggleHighlightPost, false);
			newquotes[i].addEventListener('mousemove', moveHighlightPost, false);
		}
	});


});
