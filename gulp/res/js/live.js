/* globals __ isRecent isGlobalRecent isThread post extraLocals isModView io setLocalStorage */
let liveEnabled = localStorage.getItem('live') == 'true';
let scrollEnabled = localStorage.getItem('scroll') == 'true';
let socket;
let socketPingInterval;
let forceUpdate;
let newPost;

window.addEventListener('settingsReady', function() { //after domcontentloaded

	let supportsWebSockets = 'WebSocket' in window || 'MozWebSocket' in window;
	const livecolor = document.getElementById('livecolor');
	const liveElem = document.getElementById('livetext');
	const livetext = (isThread || isRecent) && liveElem ? liveElem.childNodes[1] : null;
	let room = liveElem && liveElem.dataset.room;
	const viewRawIp = liveElem && liveElem.dataset.viewRawIp === 'true';
	const updateButton = document.getElementById('updatepostsbutton');
	const updateLive = (message, color) => {
		livecolor.style.backgroundColor = color;
		livetext.nodeValue = `${message}`;
	};
	let lastPostIds = {};
	let liveTimeout;
	let retrySocketTimeout;
	const postContainers = document.getElementsByClassName('post-container');
	for (let i = 0; i < postContainers.length; i++) {
		const postContainer = postContainers[i];
		const { board, postId } = postContainer.dataset;
		lastPostIds[board] = Math.max((lastPostIds[board] || 0), postId);
	}

	//add text before post-info to show posts deleted, moved, etc
	const markPost = (data) => {
		console.log('got mark post message', data);
		const anchor = document.getElementById(data.postId);
		const postContainer = anchor.nextSibling;
		let dataMark = '';
		switch (data.type) {
			case 'delete':
				dataMark = __('Deleted');
				break;
			case 'move':
				dataMark = __('Moved');
				break;
			default:
				return;
		}
		postContainer.classList.add('marked');
		postContainer.setAttribute('data-mark', dataMark);
		if (postContainer.classList.contains('op')) {
			//moved or delete OPs then apply to whole thread
			const postContainers = document.getElementsByClassName('post-container');
			Array.from(postContainers).forEach(e => {
				e.classList.add('marked');
				e.setAttribute('data-mark', dataMark);
			});
			//remove new reply buttons and postform
			document.getElementById('postform').remove();
			const postButtons = document.getElementsByClassName('post-button');
			Array.from(postButtons).forEach(e => e.remove());
			//and disconnect socket
			if (socket.connected === true) {
				socket.disconnect();
			}
		}
	};

	newPost = (data, options = {}) => {
		//insert at end of thread, but insert at top for globalmanage
		//console.log('got new post', data);
		const postData = data;
		lastPostIds[postData.board] = postData.postId;
		//create a new post
		const postHtml = post({
			viewRawIp,
			post: postData,
			modview: isModView,
			manage: (isRecent && !isGlobalRecent),
			globalmanage: isGlobalRecent,
			upLevel: isThread,
			...extraLocals,
		});
		let insertPoint;
		if (options.insertPoint) {
			insertPoint = options.insertPoint;
		} else if (isRecent) {
			const firstHr = document.querySelector('hr');
			const newHr = document.createElement('hr');
			const threadWrapper = document.createElement('div');
			threadWrapper.classList.add('thread');
			insertPoint = threadWrapper;
			firstHr.insertAdjacentElement('beforebegin', newHr);
			newHr.insertAdjacentElement('afterend', threadWrapper);
		} else {
			insertPoint = document.querySelector('.thread');
		}
		insertPoint.insertAdjacentHTML(options.insertPosition || 'beforeend', postHtml);
		if (isRecent) {
			//cap the recent pages to 20 posts so they dont grow to infinity
			Array.from(document.getElementsByClassName('thread'))
				.slice(20)
				.forEach(el => {
					el.previousSibling.remove();
					el.remove();
				});
		}
		//add backlink to quoted posts
		for (let j = 0; j < postData.quotes.length; j++) {
			const quoteData = postData.quotes[j];
			const quotedPost = document.querySelector(`.post-container[data-post-id="${quoteData.postId}"][data-board="${postData.board}"]`);
			if (quotedPost) { //check if exists, it wont necessarily, e.g. global/manage recent pages
				let replies = quotedPost.querySelector('.replies');
				if (!replies) {
					const quotedPostData = quotedPost.querySelector('.post-data');
					const newRepliesDiv = document.createElement('div');
					newRepliesDiv.textContent = 'Replies: ';
					newRepliesDiv.classList.add('replies', 'mt-5', 'ml-5');
					quotedPostData.appendChild(newRepliesDiv);
					replies = newRepliesDiv;
				}
				if (new RegExp(`>>${postData.postId}(\\s|$)`).test(replies.innerText)) {
					//reply link already exists (probably from a late catch up)
					continue;
				}
				const newReply = document.createElement('a');
				const space = document.createTextNode(' ');
				newReply.href = `/${postData.board}/${(isModView || isRecent) ? 'manage/' : ''}thread/${postData.thread || postData.postId}.html#${postData.postId}`;
				newReply.textContent = `>>${postData.postId}`;
				newReply.classList.add('quote');
				replies.appendChild(newReply);
				replies.appendChild(space);
			}
		}
		const newPostAnchor = document.getElementById(postData.postId);
		const newPostElement = newPostAnchor.nextSibling;
		if (scrollEnabled) {
			if (isGlobalRecent) {
				window.scrollTo(0, 0); //recent pages are reverse sort, so just go to top
			} else {
				newPostAnchor.scrollIntoView(); //scroll to post if enabled;
			}
		}
		const newPostEvent = new CustomEvent('addPost', {
			detail: {
				nonotify: options.nonotify,
				post: newPostElement,
				postId: postData.postId,
				json: postData
			}
		});
		//dispatch the event so quote click handlers, image expand, etc can be added in separate scripts by listening to the event
		setTimeout(() => {
			window.dispatchEvent(newPostEvent);
		}, 50);
	};

	let jsonParts = window.location.pathname.replace(/\.html$/, '.json').split('/');
	let jsonPath;
	if (isModView) {
		jsonParts.splice(2,1); //remove manage from json url
	}
	jsonPath = jsonParts.join('/');
	const fetchNewPosts = async () => {
		console.log('fetching posts from api');
		updateLive(__('Fetching posts...'), 'yellow');
		let json;
		let newPosts = [];
		try {
			json = await fetch(jsonPath).then(res => res.json());
		} catch (e) {
			console.error(e);
		}
		const postsList = (json && json.replies) ? json.replies : json;
		if (postsList && Array.isArray(postsList) && postsList.length > 0) {
			newPosts = postsList.filter(r => {
				return r.postId > (lastPostIds[r.board] || 0);
			}); //filter to only newer posts
			if (newPosts.length > 0) {
				for (let i = 0; i < newPosts.length; i++) {
					newPost(newPosts[i]);
				}
			}
		}
		updateLive(__('Updated'), 'green');
		return newPosts.length;
	};

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
	};

	setInterval(() => {
		if (liveEnabled && intervalStart) {
			const remaining = Math.abs((interval - (Date.now() - intervalStart))/1000);
			updateButton.value = `Update (${remaining.toFixed(0)}s)`;
		}
	}, 1000);

	const enableLive = () => {
		if (supportsWebSockets) {
			updateButton.style.display = 'none';
			if (!room) {
				const roomParts = window.location.pathname.replace(/\.html$/, '').split('/');
				room = `${roomParts[1]}-${roomParts[roomParts.length-1]}`;
			}
			socket = io({
				transports: ['websocket'],
				reconnectionAttempts: 3,
				reconnectionDelay: 3000,
				reconnectionDelayMax: 15000,
			});
			const socketPing = () => {
				const pingStart = Date.now();
				socket.volatile.emit('ping', () => {
					const latency = Date.now() - pingStart;
					updateLive(__('Connected for live posts (%sms)', latency), '#0de600');
				});
			};
			const fallbackToPolling = () => {
				console.log('falling back to polling');
				socket.close();
				supportsWebSockets = false;
				enableLive();
				clearTimeout(retrySocketTimeout);
				retrySocketTimeout = setTimeout(() => {
					supportsWebSockets = true;
					enableLive();
				}, 6000);
			};
			socket.on('connect', async () => {
				console.log('socket connected');
				await fetchNewPosts();
				socket.emit('room', room);
				clearInterval(socketPingInterval);
				socketPingInterval = setInterval(socketPing, 20000);
			});
			socket.on('message', (message) => {
				console.log(message, room);
				if (message === 'joined') {
					updateLive(__('Connected for live posts'), '#0de600');
					socketPing();
				}
			});
			socket.on('reconnect_attempt', () => {
				updateLive(__('Attempting to reconnect...'), 'yellow');
			});
			socket.on('disconnect', () => {
				console.log('lost connection to room');
				updateLive(__('Disconnected'), 'red');
			});
			socket.on('reconnect', () => {
				console.log('reconnected to room');
				fetchNewPosts();
			});
			socket.on('error', (e) => {
				updateLive(__('Socket error'), 'orange');
				console.error(e);
			});
			socket.on('connect_error', (e) => {
				updateLive(__('Error connecting'), 'orange');
				console.error(e);
				fallbackToPolling();
			});
			socket.on('reconnect_error', (e) => {
				updateLive(__('Error reconnecting'), 'orange');
				console.error(e);
			});
			socket.on('reconnect_failed', (e) => {
				updateLive(__('Failed reconnecting'), 'orange');
				console.error(e);
				fallbackToPolling();
			});
			socket.on('newPost', newPost);
			socket.on('markPost', markPost);
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
		updateLive(__('Live posts off'), 'darkgray');
	};

	const liveSetting = document.getElementById('live-setting');
	const toggleLive = () => {
		liveEnabled = !liveEnabled;
		liveEnabled ? enableLive() : disableLive();
		console.log('toggling live posts', liveEnabled);
		setLocalStorage('live', liveEnabled);
	};
	liveSetting.checked = liveEnabled;
	liveSetting.addEventListener('change', toggleLive, false);

	const scrollSetting = document.getElementById('scroll-setting');
	const toggleScroll = () => {
		scrollEnabled = !scrollEnabled;
		console.log('toggling post scrolling', scrollEnabled);
		setLocalStorage('scroll', scrollEnabled);
	};
	scrollSetting.checked = scrollEnabled;
	scrollSetting.addEventListener('change', toggleScroll, false);

	if ((isThread || isRecent) && updateButton) {
		updateButton.addEventListener('click', forceUpdate);
		liveEnabled ? enableLive() : disableLive();
	}

});
