window.addEventListener('DOMContentLoaded', (event) => {

	const isThread = /\/\w+\/thread\/\d+.html/.test(window.location.pathname);

	if (isThread) {
		const posts = document.getElementsByClassName('anchor');
		if (posts.length === 0) {
			return; //url matches, but on a 404 page
		}
		const roomParts = window.location.pathname.replace(/\.html$/, '').split('/');
		const room = `${roomParts[1]}-${roomParts[3]}`;
		const thread = document.querySelector('.thread');
		const socket = io({ transports: ['websocket'] });
		socket.on('connect', function() {
			console.log('joined room', room);
			socket.emit('room', room);
		});
        socket.on('newPost', function(data) {
			console.log('got new post');
			const postData = data;
			//create a new post
			const postHtml = post({post: postData});
			//add it to the end of the thread
			thread.insertAdjacentHTML('beforeend', postHtml);
			for (let j = 0; j < postData.quotes.length; j++) {
				const quoteData = postData.quotes[j];
				//add backlink to quoted posts
				const quotedPost = document.getElementById(quoteData.postId).nextSibling;
				let replies = quotedPost.querySelector('.replies');
				if (!replies) {
					const quotedPostData = quotedPost.querySelector('.post-data');
					const newRepliesDiv = document.createElement('div');
					newRepliesDiv.textContent = 'Replies: ';
					['replies', 'mt-5', 'ml-5'].forEach(c => {
						newRepliesDiv.classList.add(c);
					});
					quotedPostData.appendChild(newRepliesDiv);
					replies = newRepliesDiv;
				}
				const newReply = document.createElement('a');
				newReply.href = `${window.location.pathname}#${postData.postId}`;
				newReply.textContent = `>>${postData.postId} `;
				newReply.classList.add('quote');
				replies.appendChild(newReply);
			}
			const newPost = document.getElementById(postData.postId).nextSibling;
			const newPostEvent = new CustomEvent('addPost', {
				detail: {
					post: newPost,
					postId: postData.postId
				}
			});
			//dispatch the ervent so quote click handlers, image expand, etc can be added in separate scripts by listening to the event
			window.dispatchEvent(newPostEvent);
        });
	}

});
