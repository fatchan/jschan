!localStorage.getItem('live') ? localStorage.setItem('live', true) : void 0;
!localStorage.getItem('notifications') ? localStorage.setItem('notifications', false) : void 0;
!localStorage.getItem('scroll') ? localStorage.setItem('scroll', false) : void 0;

const isThread = /\/\w+\/thread\/\d+.html/.test(window.location.pathname);
let socket;

window.addEventListener('settingsReady', function(event) { //after domcontentloaded

	const livecolor = document.getElementById('livecolor');
	const livetext = document.getElementById('livetext').childNodes[1];
	const updateLive = (message, color) => {
		livecolor.style.backgroundColor = color;
		livetext.nodeValue = message;
	}

	const startLive = () => {
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
				if (new RegExp(`>>${postData.postId}(\s|$)`).test(replies.innerText)) {
					//reply link already exists (probably from a late catch up
					continue;
				}
				const newReply = document.createElement('a');
				newReply.href = `${window.location.pathname}#${postData.postId}`;
				newReply.textContent = `>>${postData.postId} `;
				newReply.classList.add('quote');
				replies.appendChild(newReply);
			}
			if (scrollEnabled) {
				window.location.hash = postData.postId; //scroll to post if enabled;
			}
			if (notificationsEnabled) {
				new Notification(document.title, {
					body: postData.nomarkup.substring(0,100)
				});
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
		socket = io({ transports: ['websocket'] }); //no polling
		socket.on('connect', () => {
			console.log('joined room', room);
			updateLive('Connected for live posts', '#0de600');
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

	let liveEnabled = localStorage.getItem('live') == 'true';
	let notificationsEnabled = localStorage.getItem('notifications') == 'true';
	let scrollEnabled = localStorage.getItem('scroll') == 'true';

	const liveSetting = document.getElementById('live-setting');
	const notificationSetting = document.getElementById('notification-setting');
	const scrollSetting = document.getElementById('scroll-setting');

	const toggleLive = () => {
		if (isThread) {
			if (socket && liveEnabled) {
				socket.disconnect();
				updateLive('Live posts disabled', 'red');
			} else if (!socket) {
				startLive();
			} else {
				socket.connect();
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
		localStorage.setItem('live', liveEnabled);
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
			}
		}
		console.log('toggling notifications', notificationsEnabled);
		localStorage.setItem('notifications', notificationsEnabled);
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
		localStorage.setItem('scroll', scrollEnabled);
		if (!liveEnabled && !changeFromConflict) {
			liveSetting.checked = true;
			toggleLive();
		}
	}
	scrollSetting.checked = scrollEnabled;
	scrollSetting.addEventListener('change', toggleScroll, false);

	if (liveEnabled) {
		startLive();
	} else {
		updateLive('Live posts disabled', 'red');
	}

});
