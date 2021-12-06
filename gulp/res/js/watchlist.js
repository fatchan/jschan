let watchList = new Set(JSON.parse(localStorage.getItem('watchlist')));
window.addEventListener('settingsReady', () => {

	const watchListInput = document.getElementById('watchlist-setting');
	watchListInput.value = [...watchList];
	const watchListClearButton = document.getElementById('watchlist-clear');

	/*
	 * todo: use compiled pug to create and/or update watchlist
	 * similar to live.js, have a separate pug function and the list container,
	 * and for each entry and add the listeners when inserting one
	 */
	//new Dragable('#watchlist', '#postform'); //make watch list draggable and maintains position

	const removeWatchList = (board, thread) => {
		watchList.delete(`${board}-${thread}`);
	}
	const clearWatchList = () => {
		watchList = new Set();
		watchListInput.value = '';
		setLocalStorage('watchlist', '[]');
		console.log('cleared watchlist');
	}
	watchListClearButton.addEventListener('click', clearWatchList, false);


});
