class ThreadWatcher {

	constructor() {
		this.watchListSet = new Set(JSON.parse(localStorage.getItem('watchlist')));
		this.settingsInput = document.getElementById('watchlist-setting');
		this.settingsInput.value = [...this.watchListSet];
		this.clearButton = document.getElementById('watchlist-clear');
		this.clearButton.addEventListener('click', this.clear, false);
		this.createListHtml();
		this.refreshInterval = setInterval(this.refresh, 60 * 1000);
		this.refresh();
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
	}

	add(board, thread) {
/*
		const watchListItemHtml = uploaditem({ data });
		.insertAdjacentHTML('beforeend', uploadItemHtml);
		const fileElem = this.fileUploadList.lastChild;
		const lastClose = fileElem.querySelector('.close');
		lastClose.addEventListener('click', () => {
			this.removeFile(fileElem, file.name, file.size);
		});
*/
	}

	remove(board, thread) {
//
	}

	clear() {
		watchList = new Set();
		watchListInput.value = '';
		setLocalStorage('watchlist', '[]');
		console.log('cleared watchlist');
	}

}

window.addEventListener('settingsReady', () => new ThreadWatcher());
