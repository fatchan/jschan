setDefaultLocalStorage('live', true);
setDefaultLocalStorage('scroll', false);
let liveEnabled = localStorage.getItem('live') == 'true';
let scrollEnabled = localStorage.getItem('scroll') == 'true';
let socket;
let forceUpdate;

window.addEventListener('settingsReady', function(event) { //after domcontentloaded

	let supportsWebSockets = 'WebSocket' in window || 'MozWebSocket' in window;
	const livecolor = document.getElementById('livecolor');
	const livetext = isThread && document.getElementById('livetext') ? document.getElementById('livetext').childNodes[1] : null;
	const updateButton = livetext ? livetext.nextSibling : null;
	const updateLive = (message, color, showRelativeTime) => {
		livecolor.style.backgroundColor = color;
		livetext.nodeValue = `${message}`;
	}
	let lastPostId;
	let liveTimeout;
	const anchors = document.getElementsByClassName('anchor');
	if (anchors.length > 0) {
		lastPostId = anchors[anchors.length - 1].id;
	}
	const thread = document.querySelector('.thread');

	const newPost = (data) => {
		console.log('got new post');
		lastPostId = data.postId;
		const postData = data;
		//create a new post
		const postHtml = post({ post: postData, modview:isModView, upLevel:isThread });
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
				newRepliesDiv.classList.add('replies', 'mt-5', 'ml-5');
				quotedPostData.appendChild(newRepliesDiv);
				replies = newRepliesDiv;
			}
			if (new RegExp(`>>${postData.postId}(\s|$)`).test(replies.innerText)) {
				//reply link already exists (probably from a late catch up)
				continue;
			}
			const newReply = document.createElement('a');
			const space = document.createTextNode(' ');
			newReply.href = `${window.location.pathname}#${postData.postId}`;
			newReply.textContent = `>>${postData.postId}`;
			newReply.classList.add('quote');
			replies.appendChild(newReply);
			replies.appendChild(space);
		}
		const newPostAnchor = document.getElementById(postData.postId);
		const newPost = newPostAnchor.nextSibling;
		if (scrollEnabled) {
			newPostAnchor.scrollIntoView(); //scroll to post if enabled;
		}
		const newPostEvent = new CustomEvent('addPost', {
			detail: {
				post: newPost,
				postId: postData.postId,
				json: postData
			}
		});
		//dispatch the event so quote click handlers, image expand, etc can be added in separate scripts by listening to the event
		setTimeout(() => {
			window.dispatchEvent(newPostEvent);
		}, 50);
	}

	let jsonParts = window.location.pathname.replace(/\.html$/, '.json').split('/');
	let jsonPath;
	if (isModView) {
		jsonParts.splice(2,1); //remove manage from json url
	}
	jsonPath = jsonParts.join('/');
	const fetchNewPosts = async () => {
		console.log('fetching posts from api');
		updateLive('Fetching posts...', 'yellow');
		let json;
		let newPosts = [];
		try {
			json = await fetch(jsonPath).then(res => res.json());
		} catch (e) {
			console.error(e);
		}
		if (json && json.replies && json.replies.length > 0) {
			newPosts = json.replies.filter(r => r.postId > lastPostId); //filter to only newer posts
			if (newPosts.length > 0) {
				for (let i = 0; i < newPosts.length; i++) {
					newPost(newPosts[i]);
				}
			}
		}
		updateLive('Updated', 'green');
		return newPosts.length;
	}

	let interval = 5000;
	let intervalStart;
	forceUpdate = async () => {
		updateButton.disabled = true;
		clearTimeout(liveTimeout);
		if ((await fetchNewPosts()) > 0) {
			interval = 5000;
		} else {
			interval = Math.min(interval*2, 90000);
		}
		setTimeout(() => {
			updateButton.disabled = false;
		}, 10000);
		if (liveEnabled) {
			intervalStart = Date.now();
			liveTimeout = setTimeout(forceUpdate, interval);
		}
	}

	setInterval(() => {
		if (liveEnabled && intervalStart) {
			const remaining = Math.abs((interval - (Date.now() - intervalStart))/1000);
			updateButton.value = `Update (${remaining.toFixed(0)}s)`;
		}
	}, 1000);

	const enableLive = () => {
		if (supportsWebSockets) {
			updateButton.style.display = 'none';
			const roomParts = window.location.pathname.replace(/\.html$/, '').split('/');
			const room = `${roomParts[1]}-${roomParts[roomParts.length-1]}`;
			socket = io({
				transports: ['websocket'],
				reconnectionAttempts: 3,
				reconnectionDelay: 3000,
				reconnectionDelayMax: 15000,
			});
			socket.on('connect', async () => {
				console.log('socket connected');
				await fetchNewPosts();
				socket.emit('room', room);
			});
			socket.on('message', (message) => {
				console.log(message, room);
				if (message === 'joined') {
					updateLive('Connected for live posts', '#0de600');
				}
			});
			socket.on('pong', (latency) => {
				if (socket.connected) {
					updateLive(`Connected for live posts (${latency}ms)`, '#0de600');
				}
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
				fetchNewPosts();
			});
			socket.on('error', (e) => {
				updateLive('Socket error', 'orange');
				console.error(e);
			});
			socket.on('connect_error', (e) => {
				updateLive('Error connecting', 'orange');
				console.error(e);
			});
			socket.on('reconnect_error', (e) => {
				updateLive('Error reconnecting', 'orange');
				console.error(e);
			});
			socket.on('reconnect_failed', (e) => {
				updateLive('Failed reconnecting', 'orange');
				console.error(e);
				console.log('failed to reconnnect, falling back to polling')
				socket.close();
				supportsWebSockets = false;
				enableLive();
			});
			socket.on('newPost', newPost);
		} else {
			//websocket not supported, update with polling to api
			updateButton.removeAttribute('style');
			forceUpdate();
		}
	};

	const disableLive = () => {
		updateButton.value = 'Update';
		updateButton.removeAttribute('style');
		clearTimeout(liveTimeout);
		if (socket && supportsWebSockets) {
			socket.disconnect();
		}
		updateLive('Live posts off', 'darkgray');
	};

	const liveSetting = document.getElementById('live-setting');
	const toggleLive = () => {
		liveEnabled = !liveEnabled;
		liveEnabled ? enableLive() : disableLive();
		console.log('toggling live posts', liveEnabled);
		setLocalStorage('live', liveEnabled);
	}
	liveSetting.checked = liveEnabled;
	liveSetting.addEventListener('change', toggleLive, false);

	const scrollSetting = document.getElementById('scroll-setting');
	const toggleScroll = () => {
		scrollEnabled = !scrollEnabled;
		console.log('toggling post scrolling', scrollEnabled);
		setLocalStorage('scroll', scrollEnabled);
	}
	scrollSetting.checked = scrollEnabled;
	scrollSetting.addEventListener('change', toggleScroll, false);

	if (isThread) {
		updateButton.addEventListener('click', forceUpdate);
		liveEnabled ? enableLive() : disableLive();
	}

});
