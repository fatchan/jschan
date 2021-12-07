class ThreadWatcher {

	constructor() {
		this.watchListSet = new Set(JSON.parse(localStorage.getItem('watchlist')));
		this.settingsInput = document.getElementById('watchlist-setting');
		this.settingsInput.value = [...this.watchListSet];
		this.clearButton = document.getElementById('watchlist-clear');
		this.clearButton.addEventListener('click', this.clear, false);
		this.createListHtml();
		this.threadWatcher = document.getElementById('threadwatcher');
		//show this time in draghandle? could also add .spin (same as captcha refresh) when updating
		this.refreshInterval = setInterval(this.refresh, 60 * 1000);
		this.refresh();

		this.add()
	}

	refresh() {
		console.log('refreshing thread watcher');
		//
	}

	//pause() { }

	//resume() { }

	createListHtml() {
		const threadWatcherHtml = threadwatcher();
		const footer = document.getElementById('bottom');
		footer.insertAdjacentHTML('afterend', threadWatcherHtml);
		new Dragable('#threadwatcher-dragHandle', '#threadwatcher');
		//todo: add() all ones saved in storage
	}

	//fetchThread() {}

	add(board, thread) {
		console.log('add');
		//todo: = fetchThread();
		//todo: dedup/prevent dup
		//todo: push to watchListSet
		//todo: modify watchListItemHtml to highlight/bold, if already in selected thread
		const watchListItemHtml = watchedthread({ watchedthread: { board: 'test', subject: 'testing 123', postId: 1 } });
		this.threadWatcher.insertAdjacentHTML('beforeend', watchListItemHtml);
		const watchedThreadElem = this.threadWatcher.lastChild;
		const lastClose = watchedThreadElem.querySelector('.close');
		lastClose.addEventListener('click', () => {
			watchedThreadElem.remove();
			this.remove(board, thread);
		});
	}

	remove(board, thread) {
		console.log('remove');
//
	}

	clear() {
		console.log('clear');
		watchList = new Set();
		watchListInput.value = '';
		setLocalStorage('watchlist', '[]');
		console.log('cleared watchlist');
	}

}

window.addEventListener('settingsReady', () => new ThreadWatcher());
