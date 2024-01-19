/* globals isManage isModView extraLocals deleteStartsWith setLocalStorage post */
window.addEventListener('DOMContentLoaded', () => {

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
	};

	const isVisible = (e) => {
		const top = e.getBoundingClientRect().top;
		const bottom = e.getBoundingClientRect().bottom;
		const height = window.innerHeight;
		return top >= 38 && bottom <= height;
	};

	const setFloatPos = (quote, float, xpos, ypos) => {
		const quotepos = quote.getBoundingClientRect();
		const post = float.firstChild;
		const iw = document.body.offsetWidth-10;
		const ih = window.innerHeight;
		const left = xpos < iw/2;
		if (left) {
			float.style.left = `${quotepos.right+10}px`;
			if (quotepos.right+10+post.offsetWidth >= iw) {
				float.style.right = '5px';
			}
		} else {
			float.style.right = `${iw-quotepos.left+15}px`;
			if (quotepos.left-15 < post.offsetWidth) {
				float.style.left = '5px';
			}
		}
		const top = ypos < ih/2;
		if (top && quotepos.bottom+post.offsetHeight < ih) {
			float.style.top = `${quotepos.top}px`;
		} else if (!top && post.offsetHeight < ypos) {
			float.style.top = `${quotepos.bottom-post.offsetHeight}px`;
		} else {
			float.style.top = '42px';
		}
	};

	const floatPost = (quote, post, xpos, ypos) => {
		const clone = document.createElement('div');
		clone.id = 'float';
		clone.classList.remove('hoverhighlighted');
		clone.appendChild(post.cloneNode(true));
		document.body.appendChild(clone);
		setFloatPos(quote, clone, xpos, ypos);
		return clone;
	};

	const toggleHighlightPost = async function (e) {
		hovering = e.type === 'mouseover';
		let jsonParts = this.pathname.replace(/\.html$/, '.json').split('/');
		let jsonPath;
		if ((isManage || isModView) && jsonParts.length === 5) {
			jsonParts.splice(2,1); //remove manage from json url
		}
		jsonPath = jsonParts.join('/');
		if (!this.hash) {
			return; //non-post number board quote
		}
		const float = document.getElementById('float');
		if (float) {
			document.body.removeChild(float);
		}
		const parentPost = this.closest('.post-container');
		let thisId = 0;
		if (parentPost) {
			thisId = parentPost.dataset.postId;
		}
		const loading = Date.now();
		lastHover = loading;
		const hash = this.hash.substring(1);
		const anchor = document.getElementById(hash);
		let hoveredPost, postJson;
		if (anchor
			&& jsonPath.split('/')[1] === anchor.nextSibling.dataset.board) {
			hoveredPost = anchor.nextSibling;
		} else {
			let hovercache = localStorage.getItem(`hovercache-${jsonPath}`);
			if (hovercache) {
				hovercache = JSON.parse(hovercache);
				if (hovercache.postId == hash) {
					postJson = hovercache;
				} else if (hovercache.replies.length > 0) {
					postJson = hovercache.replies.find(r => r.postId == hash);
				}
			}
			if (!postJson) { //wasnt cached or cache outdates
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
					setLocalStorage(`hovercache-${jsonPath}`, JSON.stringify(json));
					hoverCacheList.value = Object.keys(localStorage).filter(k => k.startsWith('hovercache'));
					if (json.postId == hash) {
						postJson = json;
					} else {
						postJson = json.replies.find(r => r.postId == hash);
					}
				} else {
					return localStorage.removeItem(`hovercache-${jsonPath}`); //thread deleted
				}
			}
			if (lastHover !== loading) {
				return; //dont show for ones not hovering
			}
			if (!postJson) {
				return; //post was deleted or missing
			}
			const postHtml = post({
				post: postJson,
				...extraLocals,
			});
			const wrap = document.createElement('div');
			wrap.innerHTML = postHtml;
			hoveredPost = wrap.firstChild.nextSibling;
		}
		if (hovering && !isVisible(hoveredPost)) {
			hoveredPost = floatPost(this, hoveredPost, e.clientX, e.clientY);
		} else {
			hovering ? hoveredPost.classList.add('hoverhighlighted') : hoveredPost.classList.remove('hoverhighlighted');
		}
		if (postJson) {
			//need this event so handlers like post hiding still apply to hover introduced posts
			const newPostEvent = new CustomEvent('addPost', {
				detail: {
					json: postJson,
					post: hoveredPost,
					postId: postJson.postId,
					hover: true,
					nonotify: true,
				}
			});
			window.dispatchEvent(newPostEvent);
		}
		if (hovering || isVisible(hoveredPost)) {
			toggleDottedUnderlines(hoveredPost, thisId);
		}
	};

	for (let i = 0; i < quotes.length; i++) {
		quotes[i].addEventListener('mouseover', toggleHighlightPost, false);
		quotes[i].addEventListener('mouseout', toggleHighlightPost, false);
	}

	window.addEventListener('addPost', function(e) {
		if (e.detail.hover) {
			return; //dont need to handle hovered posts for this
		}
		const newquotes = document.getElementsByClassName('quote'); //to get backlinks from replying posts. just an easy way. could make more efficient and only do necessary ones later.
		for (let i = 0; i < newquotes.length; i++) {
			newquotes[i].removeEventListener('mouseover', toggleHighlightPost);
			newquotes[i].removeEventListener('mouseout', toggleHighlightPost);
			newquotes[i].addEventListener('mouseover', toggleHighlightPost, false);
			newquotes[i].addEventListener('mouseout', toggleHighlightPost, false);
		}
	});

	window.addEventListener('updatePostMessage', function(e) {
		const newquotes = e.detail.post.getElementsByClassName('quote');
		for (let i = 0; i < newquotes.length; i++) {
			newquotes[i].addEventListener('mouseover', toggleHighlightPost, false);
			newquotes[i].addEventListener('mouseout', toggleHighlightPost, false);
		}
	});

});

let hoverCacheList;
window.addEventListener('settingsReady', function() {
	hoverCacheList = document.getElementById('hovercachelist-setting');
	hoverCacheList.value = Object.keys(localStorage).filter(k => k.startsWith('hovercache'));
	const hoverCacheListClearButton = document.getElementById('hovercachelist-clear');
	const clearHoverCacheList = () => {
		deleteStartsWith('hovercache');
		hoverCacheList.value = '';
		console.log('cleared cache');
	};
	hoverCacheListClearButton.addEventListener('click', clearHoverCacheList, false);
});

