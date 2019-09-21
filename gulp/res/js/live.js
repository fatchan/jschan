window.addEventListener('DOMContentLoaded', (event) => {

	const isThread = /\/\w+\/thread\/\d+.html/.test(window.location.pathname);

	if (isThread) {
		const posts = document.getElementsByClassName('anchor');
		if (posts.length === 0) {
			return; //url matches, but on a 404 page
		}
		const jsonPath = window.location.pathname.replace(/\.html$/, '.json');
		const thread = document.querySelector('.thread');
		let lastPostId = posts[posts.length - 1].id;
		const maxDelay = 120000;
		let delay = 5000;
		async function fetchNewPosts() {
			let json;
			try {
				json = await fetch(jsonPath).then(res => res.json());
			} catch (e) {
				//post might have 404'd or something else broke
				delay = maxDelay;
				return console.error(e);
			}
			if (json && json.replies && json.replies.length > 0) {
				const newPosts = json.replies.filter(r => r.postId > lastPostId); //filter to only newer posts
				if (newPosts.length > 0) {
					delay = 5000;
				} else {
//					delay = Math.min(maxDelay, delay*2);
				}
				for (let i = 0; i < newPosts.length; i++) {
					const postData = newPosts[i];
					lastPostId = postData.postId;
					//create a new post
					const postHtml = post({post: postData});
					//add it to the end of the thread
					thread.insertAdjacentHTML('beforeend', postHtml);
					for (let j = 0; j < postData.quotes.length; j++) {
						const quoteData = postData.quotes[j];
						//get the post, not the anchor (which has the id)
						const quotedPost = document.getElementById(quoteData.postId).nextSibling;
						//get the posts data from the json (which has the updated backlinks)
						const quotedPostData = json.replies.find(r => r.postId == quoteData.postId);
						//make a new post out of it temporarily
						const tempPostHtml = post({post: quotedPostData});
						const template = document.createElement('template');
						template.innerHTML = tempPostHtml;
						const tempPost = template.content.firstChild.nextSibling;
						const newReplies = tempPost.querySelector('.replies');
						//add them to the post
						const repliesParent = quotedPost.querySelector('.post-data');
						const existingReplies = quotedPost.querySelector('.replies');
						if (existingReplies) {
							existingReplies.remove();
						}
						repliesParent.appendChild(newReplies);
					}
					const newPost = document.getElementById(postData.postId).nextSibling;//nextsiblign to not get anchor
					const newPostEvent = new CustomEvent('addPost', {detail:newPost});
					//dispatch the ervent so quote click handlers, image expand, etc can be added in separate scripts by listening to the event
					window.dispatchEvent(newPostEvent);
				}
			} else {
//				delay = Math.min(maxDelay, delay*2);
			}
			setTimeout(fetchNewPosts, delay);
		}
		setTimeout(fetchNewPosts, delay);
	}

});
