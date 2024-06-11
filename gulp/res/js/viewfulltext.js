/* globals isManage isModView setLocalStorage hoverCacheList */
window.addEventListener('DOMContentLoaded', () => {

	let loading = {};

	const viewFullText = async function (e) {
		e.preventDefault();
		const parentPost = this.closest('.post-container');
		if (!parentPost) {
			return;
		}
		const postId = this.hash.substring(1);
		let jsonParts = this.pathname.replace(/\.html$/, '.json').split('/');
		let jsonPath;
		if ((isManage || isModView) && jsonParts.length === 5) {
			jsonParts.splice(2,1); //remove manage from json url
		}
		jsonPath = jsonParts.join('/');
		let hovercache = localStorage.getItem(`hovercache-${jsonPath}`);
		let postJson;
		if (hovercache) {
			hovercache = JSON.parse(hovercache);
			if (hovercache.postId == postId) {
				postJson = hovercache;
			} else if (hovercache.replies.length > 0) {
				postJson = hovercache.replies.find(r => r.postId == postId);
			}
		}
		if (!postJson) { //wasnt cached or cache outdates
			this.style.cursor = 'wait';
			let json;
			try {
				if (!loading[jsonPath]) {
					loading[jsonPath] = fetch(jsonPath).then(res => res.json());
				}
				json = await loading[jsonPath];
			} catch (e) {
				return console.error(e);
			} finally {
				this.style.cursor = '';
			}
			if (json) {
				setLocalStorage(`hovercache-${jsonPath}`, JSON.stringify(json));
				hoverCacheList.value = Object.keys(localStorage).filter(k => k.startsWith('hovercache'));
				if (json.postId == postId) {
					postJson = json;
				} else {
					postJson = json.replies.find(r => r.postId == postId);
				}
			} else {
				return localStorage.removeItem(`hovercache-${jsonPath}`); //thread deleted
			}
		}
		if (!postJson) {
			return; //post was deleted or missing, handle somehow
		}
		this.parentNode.remove();
		const messageParent = parentPost.querySelector('.post-message');
		if (messageParent) {
			messageParent.innerHTML = postJson.message;
		}
		const updatePostMessageEvent = new CustomEvent('updatePostMessage', {
			detail: {
				nonotify: true,
				post: parentPost,
				postId: postJson.postId,
				json: postJson,
			}
		});
		window.dispatchEvent(updatePostMessageEvent);
	};

	const viewFullTextLinks = document.getElementsByClassName('viewfulltext');

	for (let i = 0; i < viewFullTextLinks.length; i++) {
		viewFullTextLinks[i].addEventListener('click', viewFullText, false);
	}

});
