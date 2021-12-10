class ThreadWatcher {

	init() {
		this.loadMap();
		//todo: here, update the map and set the unread to 0 if isThread === true
		//window.addEventListener('storage', () => this.loadMap()); //this complicates things, and would need to re-render list a lot
		this.settingsInput = document.getElementById('watchlist-setting');
		this.clearButton = document.getElementById('watchlist-clear');
		this.clearButton.addEventListener('click', () => this.clear(), false)
		this.createListHtml();
		this.refreshInterval = setInterval(() => this.refresh(), 3 * 1000);
	}

	refresh() {
		console.log('refreshing thread watcher');
		for (let t of this.watchListMap.entries()) {
			const [board, postId] = t[0].split('-');
			const data = t[1];
			this.fetchThread(board, postId, data); //async fetch and update
		}
	}

	//pause() { }

	//resume() { }

	loadMap() {
		this.watchListMap = new Map(JSON.parse(localStorage.getItem('watchlist')));
	}

	commit() {
		const mapSpread = [...this.watchListMap];
		setLocalStorage('watchlist', JSON.stringify(mapSpread));
		this.settingsInput.value = mapSpread;
	}

	createListHtml() {
		const threadWatcherHtml = threadwatcher();
		const footer = document.getElementById('bottom');
		footer.insertAdjacentHTML('afterend', threadWatcherHtml);
		this.threadWatcher = document.getElementById('threadwatcher');
		new Dragable('#threadwatcher-dragHandle', '#threadwatcher');
		for (let t of this.watchListMap.entries()) {
			const [board, postId] = t[0].split('-');
			const data = t[1];
			this.add(board, postId, data, true);
		}
	}

	async fetchThread(board, postId, data) {
		console.log('thread watcher fetching', board, postId);
		let json;
		try {
			json = await fetch(`/${board}/thread/${postId}.json`).then(res => res.json());
		} catch (e) {
			console.error(e);
		}
		if (json.replies.length > 0) {
			const newPosts = json.replies.filter(r => new Date(r.date) > data.updatedDate);
			if (newPosts.length > 0) {
				console.log('new posts in watched thread', board, postId);
				data.updatedDate = new Date();
				data.unread += newPosts.length;
				const key = `${board}-${postId}`;
				this.watchListMap.set(key, data);
				this.commit();
				const updateRow = this.threadWatcher.querySelector(`[data-id=${key}]`);
				updateRow.setAttribute('data-unread', data.unread);
				//updateRow.classList.add('bold');
				//todo: notification (and extra setting for if watchlist notifs)
			}
		}
	}

	add(board, postId, data, insertOnly=false) {
		const key = `${board}-${postId}`;
		if (!insertOnly) {
			if (this.watchListMap.has(key)) {
				return; //already watching
			}
			console.log('adding', key, 'to watchlist');
			this.watchListMap.set(key, data);
		}
		//todo: modify watchListItemHtml to highlight/bold, if already in selected thread
		const watchListItemHtml = watchedthread({ watchedthread: { board, postId, ...data } });
		this.threadWatcher.insertAdjacentHTML('beforeend', watchListItemHtml);
		const watchedThreadElem = this.threadWatcher.lastChild;
		const closeButton = watchedThreadElem.querySelector('.close');
		closeButton.addEventListener('click', e => this.remove(e, key));
		//watchedThreadElem.addEventListener('mouseover', () => watchedThreadElem.classList.remove('bold'))
		this.commit();
	}

	remove(e, key) {
		console.log('removing', key, 'from watchlist');
		e.target.parentElement.remove();
		this.watchListMap.delete(key);
		this.commit();
	}

	clear() {
		console.log('clearing watchlist');
		this.watchListMap = new Map();
		Array.from(this.threadWatcher.children)
			.forEach((c, i) => i > 0 && c.remove()); //remove all except first child (the draghandle)
		setLocalStorage('watchlist', '[]');
		this.commit();
	}

}

const threadWatcher = new ThreadWatcher();
window.addEventListener('settingsReady', () => threadWatcher.init());
