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

	let hoverLoading = {};
	const toggleHighlightPost = async function(e) {
		const jsonPath = this.pathname.replace(/html$/, 'json');
		if (hoverLoading[jsonPath]) {
			//hovering off while loading;
			delete hoverLoading[jsonPath];
			return;
		}
		const float = document.getElementById('float');
		if (float != null) {
			return document.body.removeChild(float);
		}
		if (!this.hash) {
			return; //non-post number board quote
		}
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
				if (hoverLoading[jsonPath]) {
					return;
				}
				hoverLoading[jsonPath] = true;
				let json;
				try {
					json = await fetch(jsonPath).then(res => res.json());
				} catch (e) {
					delete hoverLoading[jsonPath];
					return console.error(e);
				}
				if (json) {
					threadJson = json;
					setLocalStorage(`hovercache-${jsonPath}`, JSON.stringify(threadJson));
					if (!hoverLoading[jsonPath]) {
						return //stopped hovering, so dont toggle after loading
					}
				} else {
					delete hoverLoading[jsonPath];
					return localStorage.removeItem(`hovercache-${jsonPath}`); //thread deleted
				}
			}
			if (threadJson.postId == hash) {
				postJson = threadJson;
			} else {
				postJson = threadJson.replies.find(r => r.postId == hash);
			}
			if (!postJson) {
				delete hoverLoading[jsonPath];
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
		if (anchor && isVisible(hoveredPost)) {
			hoveredPost.classList.toggle('highlighted');
		} else {
			floatPost(hoveredPost, e.clientX, e.clientY);
		}
		delete hoverLoading[jsonPath];
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
