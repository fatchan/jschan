window.addEventListener('DOMContentLoaded', (event) => {

	const viewFullTextLinks = document.getElementsByClassName('viewfulltext');
	let loading = {};

	const viewFullText = async function (e) {
		e.preventDefault();
		const parentPost = this.closest('.post-container');
		const postId = this.hash.substring(1);
		let jsonParts = this.pathname.replace(/\.html$/, '.json').split('/');
		let jsonPath;
		if (isModView && jsonParts.length === 5) {
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
		if (!postJson) {//wasnt cached or cache outdates
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
		const messageParent = parentPost.querySelector('.post-message')
		if (messageParent) {
			messageParent.innerHTML = postJson.message;
		}

		const updatePostMessageEvent = new CustomEvent('updatePostMessage', {
			detail: {
				post: parentPost,
				postId: postJson.postId,
				json: postJson
			}
		});
		window.dispatchEvent(updatePostMessageEvent);
	}

	for (let i = 0; i < viewFullTextLinks.length; i++) {
		viewFullTextLinks[i].addEventListener('click', viewFullText, false);
	}

	window.addEventListener('addPost', function(e) {
		if (e.detail.hover) {
			return; //dont need to handle for hovered posts
		}
		const post = e.detail.post;
		const viewFullTextLink = post.querySelector('#viewfulltext');
		if (viewFullTextLink) {
			viewFullTextLink.addEventListener('click', viewFullText, false);
		}
	});

});
