class ThreadWatcher {

	init() {
		this.watchListMap = new Map(JSON.parse(localStorage.getItem('watchlist')));
		this.settingsInput = document.getElementById('watchlist-setting');
		this.clearButton = document.getElementById('watchlist-clear');
		this.clear = this.clear.bind(this);
		this.clearButton.addEventListener('click', this.clear, false)
		this.createListHtml();
		this.refreshInterval = setInterval(this.refresh, 60 * 1000);
		this.refresh(); //store last refresh in ls? do a setTimeout until then, run once, then start the interval inside the timeout callback
	}

	refresh() {
		console.log('refreshing thread watcher');
	}

	//pause() { }

	//resume() { }

	updateSettingsList() {
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
			console.log(t)
			const [board, postId] = t[0].split('-');
			const subject = t[1];
			this.add(board, postId, subject, true);
		}
	}

	fetchThread() {
		//todo: if 404, remove()
	}

	add(board, postId, subject, insertOnly=false) {
		const key = `${board}-${postId}`;
		if (!insertOnly) {
			if (this.watchListMap.has(key)) {
				return; //already watching
			}
			console.log('adding', key, 'to watchlist');
			this.watchListMap.set(key, subject);
		}
		//todo: = fetchThread();
		//todo: modify watchListItemHtml to highlight/bold, if already in selected thread
		const watchListItemHtml = watchedthread({ watchedthread: { board, postId, subject } });
		this.threadWatcher.insertAdjacentHTML('beforeend', watchListItemHtml);
		const watchedThreadElem = this.threadWatcher.lastChild;
		const closeButton = watchedThreadElem.querySelector('.close');
		closeButton.addEventListener('click', e => this.remove(e, key));
		this.updateSettingsList();
	}

	remove(e, key) {
		console.log('removing', key, 'from watchlist');
		e.target.parentElement.remove();
		this.watchListMap.delete(key);
		this.updateSettingsList();
	}

	clear() {
		console.log('clearing watchlist');
		this.watchListMap = new Map();
		Array.from(this.threadWatcher.children)
			.forEach((c, i) => i > 0 && c.remove()); //remove all except first child (the draghandle)
		setLocalStorage('watchlist', '[]');
		this.updateSettingsList();
	}

}

const threadWatcher = new ThreadWatcher();
window.addEventListener('settingsReady', () => threadWatcher.init());
