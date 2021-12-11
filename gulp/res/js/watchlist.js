class ThreadWatcher {

//todo:
//- dont increase unread count when refreshing if already have a thread opened
//- option to hide/minimise/disable thread watcher, or not show unless there is at least 1 thread in watchlist
//- update settings export to include watched threads
//- notifications, probably in fetchthread()
//- try and deal with having more tabs open running refresh more often than necessary. maybe for this it has to
//  use a serviceworker so it only has 1 thread background fetching (problems: needs https so maybe wont work on
//  tor, lokinet, etc). with service worker needs to be some mechanism that only 1 client/tab send message to do
//  a fetch, or maybe it only responds at most every 60 seconds since the client can share with eachother.

	init() {
		this.watchListMap = new Map(JSON.parse(localStorage.getItem('watchlist')));
		window.addEventListener('storage', e => this.storageEventHandler(e)); 
		this.settingsInput = document.getElementById('watchlist-setting');
		this.clearButton = document.getElementById('watchlist-clear');
		this.clearButton.addEventListener('click', () => this.clear(), false)
		const threadMatch = window.location.pathname.match(/^\/(?<threadBoard>\w+)(?:\/manage)?\/thread\/(?<threadId>\d+)\.html$/);
		if (threadMatch && threadMatch.groups) {
			const key = `${threadMatch.groups.threadBoard}-${threadMatch.groups.threadId}`;
			const data = this.watchListMap.get(key);
			if (data) {
				data.unread = 0;
				data.updatedDate = new Date();
				this.watchListMap.set(key, data);
				this.commit();
			}
		}
		this.createList();
		this.refreshInterval = setInterval(() => this.refresh(), 60 * 1000);
	}

	refresh() {
		for (let t of this.watchListMap.entries()) {
			const [board, postId] = t[0].split('-');
			const data = t[1];
			this.fetchThread(board, postId, data);
		}
	}

	async fetchThread(board, postId, data) {
		let res, json;
		try {
			res = await fetch(`/${board}/thread/${postId}.json`);
			json = await res.json();
		} catch (e) { /* ignore */ }
		if (json && json.replies && json.replies.length > 0) {
			const updatedDate = new Date(data.updatedDate);
			const newPosts = json.replies.filter(r => new Date(r.date) > updatedDate);
			if (newPosts.length > 0) {
				data.subject = json.subject;
				data.updatedDate = new Date();
				data.unread += newPosts.length;
				const key = `${board}-${postId}`;
				this.watchListMap.set(key, data);
				this.updateRow(board, postId, data);
				this.commit();
			}
		} else if (res && res.status === 404) {
			console.log('removing 404 thread from watchlist');
			this.remove(board, postId);
		}
	}

	storageEventHandler(e) {
		if (e.storageArea === localStorage
			&& e.key === 'watchlist') {
			console.log('updating watchlist from another context');
			const newMap = new Map(JSON.parse(e.newValue));
			const deleted = [];
			this.watchListMap.forEach((data, key) => {
				if (!newMap.has(key)) {
					const [board, postId] = key.split('-');
					this.deleteRow(board, postId);
				}
			});
			newMap.forEach((data, key) => {
				const [board, postId] = key.split('-');
				const oldData = this.watchListMap.get(key);
				if (!oldData) {
					this.addRow(board, postId, data);
				} else if (oldData && (oldData.unread !== data.unread
					|| oldData.subject !== data.subject)) {
					this.updateRow(board, postId, data);
				}
			});
			this.watchListMap = new Map(JSON.parse(e.newValue));
		}
	}

	commit() {
		const mapSpread = [...this.watchListMap];
		setLocalStorage('watchlist', JSON.stringify(mapSpread));
		this.settingsInput.value = mapSpread;
	}

	createList() {
		const threadWatcherHtml = threadwatcher();
		const footer = document.getElementById('bottom');
		footer.insertAdjacentHTML('afterend', threadWatcherHtml);
		this.threadWatcher = document.getElementById('threadwatcher');
		new Dragable('#threadwatcher-dragHandle', '#threadwatcher');
		for (let t of this.watchListMap.entries()) {
			const [board, postId] = t[0].split('-');
			const data = t[1];
			this.addRow(board, postId, data);
		}
	}

	add(board, postId, data) {
		const key = `${board}-${postId}`;
		if (this.watchListMap.has(key)) {
			return;
		}
		this.watchListMap.set(key, data);
		this.addRow(board, postId, data);
		this.commit();
	}

	remove(board, postId) {
		this.deleteRow(board, postId);
		this.watchListMap.delete(`${board}-${postId}`);
		this.commit();
	}

	clear() {
		for (let t of this.watchListMap.entries()) {
			const [board, postId] = t[0].split('-');
			const data = t[1];
			this.deleteRow(board, postId, data);
		}
		this.watchListMap = new Map();
		this.commit();
	}

	addRow(board, postId, data) {
		const watchListItemHtml = watchedthread({ watchedthread: { board, postId, ...data } });
		this.threadWatcher.insertAdjacentHTML('beforeend', watchListItemHtml);
		const watchedThreadElem = this.threadWatcher.lastChild;
		const closeButton = watchedThreadElem.querySelector('.close');
		closeButton.addEventListener('click', e => this.remove(board, postId));
	}

	deleteRow(board, postId) {
		const row = this.threadWatcher.querySelector(`[data-id="${board}-${postId}"]`);
		row.remove();
	}

	updateRow(board, postId, data) {
		const row = this.threadWatcher.querySelector(`[data-id="${board}-${postId}"]`);
		if (data.unread === 0) {
			row.removeAttribute('data-unread');
		} else {
			row.setAttribute('data-unread', data.unread);
		}
	}

}

const threadWatcher = new ThreadWatcher();

window.addEventListener('settingsReady', () => {

	threadWatcher.init()

	//settings shit goes here

});
