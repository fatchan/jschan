/* globals setLocalStorage hoverCacheList newPost */
window.addEventListener('DOMContentLoaded', () => {

	let loading = {};

	const hideOmitted = (e) => {
		e.target.nextSibling.style.display = 'unset';
		const thread = e.target.closest('.thread');
		const posts = Array.from(thread.querySelectorAll('.post-container'));
		let replies = posts.slice(1);
		if (e.target.dataset.shown > 0) {
			replies = replies.slice(0, -parseInt(e.target.dataset.shown));
		}
		replies.forEach(r => {
			r.previousSibling.remove();
			r.remove();
		});
		e.target.removeAttribute('data-open');
		e.target.src = '/file/plus.png';
	};

	const expandOmitted = async (e) => {
		const threadId = e.target.dataset.thread;
		const board = e.target.dataset.board;
		const parentPost = e.target.closest('.post-container');
		const firstPreviewReply = parentPost.nextSibling && parentPost.nextSibling.nextSibling; //the first preview reply
		const jsonPath = `/${board}/thread/${threadId}.json`;
		let hovercache = localStorage.getItem(`hovercache-${jsonPath}`);
		let replies;
		if (hovercache) {
			hovercache = JSON.parse(hovercache);
			//if we have the first preview reply in cache, the cache is fresh enough to show the omitted posts
			if (firstPreviewReply && hovercache.replies.find(r => r.postId == firstPreviewReply.dataset.postId)) {
				replies = hovercache.replies;
			}
			//note: will always fetch (on new page load) for sticky preview replies = 0
		}
		if (!replies) {
			e.target.style.cursor = 'wait';
			e.target.classList.add('spin');
			let json;
			try {
				//same as hovering post replies
				if (!loading[jsonPath]) {
					loading[jsonPath] = fetch(jsonPath).then(res => res.json());
				}
				json = await loading[jsonPath];
			} catch (e) {
				return console.error(e);
			} finally {
				e.target.style.cursor = '';
				e.target.classList.remove('spin');
			}
			if (json) {
				setLocalStorage(`hovercache-${jsonPath}`, JSON.stringify(json));
				hoverCacheList.value = Object.keys(localStorage).filter(k => k.startsWith('hovercache'));
				replies = [...json.replies];
			} else {
				return localStorage.removeItem(`hovercache-${jsonPath}`); //thread deleted
			}
		}
		if (!replies) {
			return;
		}
		const opReplies = parentPost.querySelector('.replies');
		if (opReplies && opReplies.innerText.includes('+')) {
			const earlierLink = opReplies.lastElementChild;
			earlierLink.previousSibling.remove();
			earlierLink.remove();
		}
		replies = replies.reverse();
		e.target.nextSibling.style.display = 'none';
		e.target.src = '/file/minus.png';
		e.target.dataset.open = true;
		if (firstPreviewReply) {
			replies = replies.filter(r => r.postId < firstPreviewReply.dataset.postId);
		}
		replies.forEach(r => {
			newPost(r, {
				nonotify: true,
				insertPoint: firstPreviewReply ? parentPost.nextSibling : parentPost,
				insertPosition: firstPreviewReply ? 'beforebegin' : 'afterend',
			});
		});
	};

	const handleExpandClick = (e) => {
		if (e.target.dataset.open) {
			hideOmitted(e);
		} else {
			expandOmitted(e);
		}
	};

	const expandOmittedButtons = document.getElementsByClassName('expand-omitted');

	for (let i = 0; i < expandOmittedButtons.length; i++) {
		expandOmittedButtons[i].addEventListener('click', handleExpandClick, false);
	}

});
