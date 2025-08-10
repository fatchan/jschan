/* globals Dragable threadwatcher watchedthread Minimisable setLocalStorage */
class ThreadWatcher {
	init() {
		//dont bother loading if no footer, must be minimal view
		this.footer = document.getElementById('bottom');
		if (!this.footer) {
			return;
		}

		//read the watchlist map and minimised state from localstorage
		this.watchListMap = new Map(JSON.parse(localStorage.getItem('watchlist')));
		this.threadMatch = window.location.pathname.match(/^\/(\w+)(?:\/manage)?\/thread\/(\d+)\.html$/);

		//call the updatehandler when storage changes in another context
		window.addEventListener('storage', e => this.storageEventHandler(e));

		//setup the settings menu and "clear" button
		this.settingsInput = document.getElementById('watchlist-setting');
		this.clearButton = document.getElementById('watchlist-clear');
		this.clearButton.addEventListener('click', () => this.clear(), false);

		//create a Minimisable instance for the thread watcher with a localStorage key
		this.minimisable = new Minimisable('#threadwatcher', [
			{ selector: '#minimise', cb: 'toggleMinimise', textVar: 'minimised', trueText: '[+]', falseText: '[-]' },
		], 'threadwatcher-minimise');

		//create and insert the watchlist
		this.createList();

		//attach minimisable now that the elem is created
		this.minimisable.init();

		//check if we are in a thread, and setup events for when the tab is focused/unfocused
		this.isFocused = document.hasFocus();
		if (this.threadMatch !== null) {
			window.addEventListener('focus', () => this.focusHandler(this.threadMatch[1], this.threadMatch[2]));
			window.addEventListener('blur', () => this.blurHandler());
			if (this.isFocused === true) {
				//set unread=0 for the current thread if the tab is focused
				this.focusHandler(this.threadMatch[1], this.threadMatch[2]);
			}
		}

		//start refreshing on an interval
		this.refreshInterval = setInterval(() => this.refresh(), 60 * 1000);
	}

	//refresh all the threads in the watchlist map
	refresh() {
		this.watchListMap.size > 0 && console.log('refreshing watchlist');
		for (let t of this.watchListMap.entries()) {
			const [board, postId] = t[0].split('-');
			const data = t[1];
			this.fetchThread(board, postId, data);
		}
	}

	//fetch a thread from the API and check if there are newer posts, and set unread if necessary.
	async fetchThread(board, postId, data) {
		let res, json;
		try {
			res = await fetch(`/${board}/thread/${postId}.json`);
			json = await res.json();
		} catch (e) { /* ignore */ }
		if (json && json.replies) {
			const newData = {
				...data,
				subject: (json.subject || json.nomarkup || `#${json.postId}`).substring(0, 25),
			};
			const updatedDate = new Date(data.updatedDate);
			const newPosts = json.replies.filter(r => new Date(r.date) > updatedDate);
			if (newPosts.length > 0) {
				if (this.isFocused && this.threadMatch
					&& this.threadMatch[1] === board && this.threadMatch[2] === postId) {
					//unread=0 when fetching from inside a thread that is focused
					newData.unread = 0;
				} else {
					newData.unread += newPosts.length;
					//this.notify(newPosts);
				}
			}
			if (newData.subject !== data.subject
				|| newData.unread !== data.unread) {
				newData.updatedDate = new Date();
				const key = `${board}-${postId}`;
				this.watchListMap.set(key, newData);
				this.updateRow(board, postId, newData);
				this.commit();
			}

		} else if (res && res.status === 404) {
			console.log('removing 404 thread from watchlist');
			this.remove(board, postId);
		}
	}

	/*send notifications (if enabled and following other settings) for posts fetched by threadwatcher
	notify(newPosts) {
		if (notificationsEnabled) {
			//i dont like fetching and creating the set each time, but it could be updated cross-context so its necessary (for now)
			const yous = new Set(JSON.parse(localStorage.getItem('yous')));
			for (const reply of newPosts) {
				const isYou = yous.has(`${reply.board}-${reply.postId}`);
				const quotesYou = reply.quotes.some(q => yous.has(`${reply.board}-${q.postId}`))
				if (!isYou && !(notificationYousOnly && !quotesYou)) {
					const notificationOptions = formatNotificationOptions(reply);
					try {
						new Notification(`Post in watched thread: ${document.title}`, notificationOptions);
					} catch (e) {
						console.log('failed to send notification', e);
					}
				}
			}
		}
	}*/

	//handle event for when storage changes in another tab and update the watcher to be in sync
	storageEventHandler(e) {
		if (e.storageArea === localStorage
			&& e.key === 'watchlist') {
			console.log('updating watchlist from another context');
			const newMap = new Map(JSON.parse(e.newValue));
			this.watchListMap.forEach((data, key) => {
				if (!newMap.has(key)) {
					const [board, postId] = key.split('-');
					this.deleteRow(board, postId);
				}
			});
			//let setOwnUnread = false;
			newMap.forEach((data, key) => {
				const [board, postId] = key.split('-');
				const oldData = this.watchListMap.get(key);
				if (!oldData) {
					this.addRow(board, postId, data);
				} else if (oldData && (oldData.unread !== data.unread
					|| oldData.subject !== data.subject)) {
					/*if (this.isFocused && this.threadMatch
						&& this.threadMatch[1] === board && this.threadMatch[2] === postId) {
						setOwnUnread = true;
						data.unread = 0;
					}*/
					this.updateRow(board, postId, data);
				}
			});
			this.watchListMap = new Map(JSON.parse(e.newValue));
			this.setVisibility();
			/*if (setOwnUnread === true) {
				this.commit();
			}*/
		}
	}

	//handle event when current page becomes focused (only listens on thread pages) and set unread=0 for this thread
	focusHandler(board, postId) {
		this.isFocused = true;
		const key = `${board}-${postId}`;
		const data = this.watchListMap.get(key);
		if (data && data.unread !== 0) {
			data.unread = 0;
			data.updatedDate = new Date();
			this.watchListMap.set(key, data);
			this.updateRow(board, postId, data);
			this.commit();
		}
	}

	//self explanatory
	blurHandler() {
		this.isFocused = false;
	}

	//commit any changes to localstorage and settings menu box (readonly)
	commit() {
		const mapSpread = [...this.watchListMap];
		setLocalStorage('watchlist', JSON.stringify(mapSpread));
		this.settingsInput.value = mapSpread;
		this.setVisibility();
	}

	//toggles watcher visibility
	setVisibility() {
		if (this.threadWatcher) {
			// this.minimisable.toggleMinimise();
			this.threadWatcher.style.display = (this.watchListMap.size === 0 ? 'none' : null);
		}
	}

	//create the actual thread watcher box and draghandle and insert it into the page
	createList() {
		const threadWatcherHtml = threadwatcher({ minimised: this.minimisable.isMinimised() });
		this.footer.insertAdjacentHTML('afterend', threadWatcherHtml);
		this.threadWatcher = document.getElementById('threadwatcher');
		if (this.watchListMap.size === 0) {
			this.threadWatcher.style.display = 'none';
		}
		//reuse the dragable class for something :^)
		new Dragable('#threadwatcher-dragHandle', '#threadwatcher');
		for (let t of this.watchListMap.entries()) {
			const [board, postId] = t[0].split('-');
			const data = t[1];
			this.addRow(board, postId, data);
		}
	}

	//add a thread to the watchlist map
	add(board, postId, data) {
		const key = `${board}-${postId}`;
		if (this.watchListMap.has(key)) {
			//dont add duplicates
			return;
		}
		this.watchListMap.set(key, data);
		this.addRow(board, postId, data);
		this.commit();
	}

	//remove a thread from the watchlist map
	remove(board, postId) {
		this.deleteRow(board, postId);
		this.watchListMap.delete(`${board}-${postId}`);
		this.commit();
	}

	//remove all threads from the watchlist
	clear() {
		for (let t of this.watchListMap.entries()) {
			const [board, postId] = t[0].split('-');
			const data = t[1];
			this.deleteRow(board, postId, data);
		}
		this.watchListMap = new Map();
		this.commit();
	}

	//add the actual row html to the watcher
	addRow(board, postId, data) {
		const isCurrentThread = this.threadMatch != null
			&& this.threadMatch[1] === board && this.threadMatch[2] === postId;
		const watchListItemHtml = watchedthread({ watchedthread: { board, postId, ...data, isCurrentThread } });
		this.threadWatcher.insertAdjacentHTML('beforeend', watchListItemHtml);
		const watchedThreadElem = this.threadWatcher.lastChild;
		const closeButton = watchedThreadElem.querySelector('.close');
		//when x button clicked, call remove
		closeButton.addEventListener('click', () => this.remove(board, postId));
	}

	//delete the actual row from the watcher
	deleteRow(board, postId) {
		const row = this.threadWatcher.querySelector(`[data-id="${board}-${postId}"]`);
		row && row.remove();
	}

	//update a row in the watcher for new unread count
	updateRow(board, postId, data) {
		const row = this.threadWatcher.querySelector(`[data-id="${board}-${postId}"]`);
		if (data.unread === 0) {
			//remove the attribute completely to not show (0), we only want to show (1) or more
			row.removeAttribute('data-unread');
		} else {
			row.setAttribute('data-unread', data.unread);
		}
		//subject *can* change rarely, if the op was edited
		row.children[1].textContent = `/${board}/ - ${data.subject}`;
	}
}

const threadWatcher = new ThreadWatcher();

window.addEventListener('settingsReady', () => {
	threadWatcher.init();
});
