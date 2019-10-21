window.addEventListener('DOMContentLoaded', (event) => {

	const isThread = /\/\w+\/thread\/\d+.html/.test(window.location.pathname);

	if (isThread) {
		const anchors = document.getElementsByClassName('anchor');
		if (anchors.length === 0) {
			return; //url matches, but on a 404 page so dont bother with the rest
		}
		let lastPostId = anchors[anchors.length - 1].id;
		const newPost = (data) => {
			console.log('got new post');
			lastPostId = data.postId;
			const postData = data;
			//create a new post
			const postHtml = post({ post: postData });
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
				if (new RegExp(`>>${postId}(\s|$)`).test(replies.innerText)) {
					//reply link already exists (probably from a late catch up
					continue;
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
			//dispatch the event so quote click handlers, image expand, etc can be added in separate scripts by listening to the event
			window.dispatchEvent(newPostEvent);
		}
		const jsonPath = window.location.pathname.replace(/\.html$/, '.json');
		const jsonCatchup = async () => {
			console.log('catching up after reconnect');
			updateLive('Checking for missed posts...', 'yellow');
			let json;
			try {
				json = await fetch(jsonPath).then(res => res.json());
			} catch (e) {
				console.error(e);
			}
			if (json && json.replies && json.replies.length > 0) {
				const newPosts = json.replies.filter(r => r.postId > lastPostId); //filter to only newer posts
				if (newPosts.length > 0) {
					for (let i = 0; i < newPosts.length; i++) {
						newPost(newPosts[i]);
					}
				}
			}
			setTimeout(() => {
				updateLive('Connected for live posts', '#0de600');
			}, 1000);
		}
		const roomParts = window.location.pathname.replace(/\.html$/, '').split('/');
		const room = `${roomParts[1]}-${roomParts[3]}`;
		const thread = document.querySelector('.thread');
		const socket = io({ transports: ['websocket'] }); //no polling
		const livecolor = document.getElementById('livecolor');
		const livetext = document.getElementById('livetext').childNodes[1];
		const updateLive = (message, color) => {
			livecolor.style.backgroundColor = color;
			livetext.nodeValue = message;
		}

		let firstConnect = true;
		socket.on('connect', () => {
			console.log('joined room', room);
			if (firstConnect) {
				updateLive('Connected for live posts', '#0de600');
				firstConnect = false;
			}
			socket.emit('room', room);
		});
		socket.on('pong', (latency) => {
			if (socket.connected) {
				updateLive(`Connected for live posts (${latency}ms)`, '#0de600');
			}
		});
		socket.on('reconnect_error', () => {
			updateLive('Error reconnecting', 'orange');
		});
		socket.on('reconnect_attempt', () => {
			updateLive('Attempting to reconnect...', 'yellow');
		});
		socket.on('disconnect', () => {
			console.log('lost connection to room');
			updateLive('Disconnected', 'red');
		});
		socket.on('reconnect', () => {
			console.log('reconnected to room');
			jsonCatchup();
		});
		socket.on('newPost', newPost);

	}

});
