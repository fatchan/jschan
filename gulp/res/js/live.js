setDefaultLocalStorage('live', true);
setDefaultLocalStorage('notifications', false);
setDefaultLocalStorage('scroll', false);

var socket;

window.addEventListener('settingsReady', function(event) { //after domcontentloaded

	const livecolor = document.getElementById('livecolor');
	const livetext = isThread ? document.getElementById('livetext').childNodes[1] : null;
	const updateButton = livetext ? livetext.nextSibling : null;
	const updateLive = (message, color) => {
		livecolor.style.backgroundColor = color;
		livetext.nodeValue = message;
	}

	let lastPostId;
	const anchors = document.getElementsByClassName('anchor');

	let liveEnabled = localStorage.getItem('live') == 'true';
	let notificationsEnabled = localStorage.getItem('notifications') == 'true';
	let scrollEnabled = localStorage.getItem('scroll') == 'true';

	if (anchors.length > 0) {
		lastPostId = anchors[anchors.length - 1].id;
	}
	const thread = document.querySelector('.thread');
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
			if (new RegExp(`>>${postData.postId}(\s|$)`).test(replies.innerText)) {
				//reply link already exists (probably from a late catch up
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
		if (notificationsEnabled) {
			if (!window.myPostId || window.myPostId != postData.postId) {
				new Notification(document.title, {
					body: postData.nomarkup ? postData.nomarkup.substring(0,100) : ''
				});
			}
		}
		const newPostEvent = new CustomEvent('addPost', {
			detail: {
				post: newPost,
				postId: postData.postId,
				json: postData
			}
		});
		//dispatch the event so quote click handlers, image expand, etc can be added in separate scripts by listening to the event
		window.dispatchEvent(newPostEvent);
	}


	const jsonPath = window.location.pathname.replace(/\.html$/, '.json');
	const jsonCatchup = async () => {
		console.log('catching up after reconnect');
		updateLive('Fetching posts...', 'yellow');
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
	}

	const startLive = () => {
		const roomParts = window.location.pathname.replace(/\.html$/, '').split('/');
		const room = `${roomParts[1]}-${roomParts[3]}`;
		socket = io({ transports: ['websocket'] });
		socket.on('connect', () => {
			updateButton.style.display = 'none';
			console.log('joined room', room);
			updateLive('Connected for live posts', '#0de600');
			socket.emit('room', room);
		});
		socket.on('pong', (latency) => {
			updateButton.style.display = 'none';
			if (socket.connected) {
				updateLive(`Connected for live posts (${latency}ms)`, '#0de600');
			}
		});
		socket.on('reconnect_attempt', () => {
			updateLive('Attempting to reconnect...', 'yellow');
		});
		socket.on('disconnect', () => {
			updateButton.removeAttribute('style');
			console.log('lost connection to room');
			updateLive('Disconnected', 'red');
		});
		socket.on('reconnect', () => {
			updateButton.style.display = 'none';
			console.log('reconnected to room');
			jsonCatchup();
		});
		socket.on('error', (e) => {
			updateButton.removeAttribute('style');
			updateLive('Socket error', 'orange');
			console.error(e);
		});
		socket.on('connect_error', (e) => {
			updateButton.removeAttribute('style');
			updateLive('Error connecting', 'orange');
			console.error(e);
		});
		socket.on('reconnect_error', (e) => {
			updateButton.removeAttribute('style');
			updateLive('Error reconnecting', 'orange');
			console.error(e);
		});
		socket.on('newPost', newPost);
	}

	const liveSetting = document.getElementById('live-setting');
	const notificationSetting = document.getElementById('notification-setting');
	const scrollSetting = document.getElementById('scroll-setting');

	const toggleLive = () => {
		if (isThread) {
			if (socket && liveEnabled) {
				socket.disconnect();
				updateLive('Live posts disabled', 'red');
			} else {
				if (!socket) {
					startLive();
				} else {
					socket.connect();
				}
				jsonCatchup();
			}
		}
		liveEnabled = !liveEnabled;
		if (!liveEnabled) {
			//disable notifications and scroll when live off because they wont work
			if (notificationsEnabled) {
				notificationSetting.checked = false;
				toggleNotifications(null, true);
			}
			if (scrollEnabled) {
				scrollSetting.checked = false;
				toggleScroll(null, true);
			}
		}
		console.log('toggling live posts', liveEnabled);
		setLocalStorage('live', liveEnabled);
	}
	liveSetting.checked = liveEnabled;
	liveSetting.addEventListener('change', toggleLive, false);

	const toggleNotifications = async (change, changeFromConflict) => {
		notificationsEnabled = !notificationsEnabled;
		if (notificationsEnabled) {
			const result = await Notification.requestPermission()
			if (result != 'granted') {
				//user denied permission popup
				notificationsEnabled = false;
				notificationSetting.checked = false;
				return;
			}
		}
		console.log('toggling notifications', notificationsEnabled);
		setLocalStorage('notifications', notificationsEnabled);
		if (!liveEnabled && !changeFromConflict) {
			liveSetting.checked = true;
			toggleLive();
		}
	}
	notificationSetting.checked = notificationsEnabled;
	notificationSetting.addEventListener('change', toggleNotifications, false);

	const toggleScroll = (change, changeFromConflict) => {
		scrollEnabled = !scrollEnabled;
		console.log('toggling post scrolling', scrollEnabled);
		setLocalStorage('scroll', scrollEnabled);
		if (!liveEnabled && !changeFromConflict) {
			liveSetting.checked = true;
			toggleLive();
		}
	}
	scrollSetting.checked = scrollEnabled;
	scrollSetting.addEventListener('change', toggleScroll, false);

	if (isThread) {
		const forceUpdate = async () => {
			updateButton.disabled = true;
			await jsonCatchup();
			updateLive('Updated', 'green');
			setTimeout(() => {
				updateButton.disabled = false;
			}, 10000);
		}
		updateButton.addEventListener('click', forceUpdate);
		if (liveEnabled) {
			updateButton.style.display = 'none';
			startLive();
		} else {
			updateLive('Live posts disabled', 'red');
		}
	}

});
