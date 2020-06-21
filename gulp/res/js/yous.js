setDefaultLocalStorage('yous-setting', true);
let yousEnabled = localStorage.getItem('yous-setting') == 'true';
setDefaultLocalStorage('yous', '[]');
let savedYous = JSON.parse(localStorage.getItem('yous'));

const toggleAll = () => savedYous.forEach(y => toggleOne(y));

const toggleQuotes = (quotes) => {
	quotes.forEach(q => {
		q.classList[yousEnabled?'add':'remove']('you');
	});
}

const toggleOne = (you) => {
	const [board, postId] = you.split('-');
	const post = document.querySelector(`[data-board="${board}"][data-post-id="${postId}"]`);
	if (post) {
		const postName = post.querySelector('.post-name');
		if (postName) {
			postName.classList[yousEnabled?'add':'remove']('you');
		}
	}
	const quotes = document.querySelectorAll(`.quote[href^="/${board}/"][href$="#${postId}"]`);
	if (quotes) {
		toggleQuotes(quotes);
	}
}

if (yousEnabled) {
	toggleAll();
}

window.addEventListener('addPost', (e) => {
	savedYous = JSON.parse(localStorage.getItem('yous'));
	const postYou = `${e.detail.json.board}-${e.detail.postId}`;
	if (window.myPostId == e.detail.postId) {
		savedYous.push(postYou);
		setLocalStorage('yous', JSON.stringify(savedYous));
	}
	if (savedYous.includes(postYou)) {
		toggleOne(postYou);
	}
	const youHoverQuotes = e.detail.json.quotes
		.concat(e.detail.json.backlinks)
		.map(q => `${e.detail.json.board}-${q.postId}`)
		.filter(y => savedYous.includes(y))
		.map(y => {
			const [board, postId] = y.split('-');
			return e.detail.post.querySelector(`.quote[href^="/${board}/"][href$="#${postId}"]`)
		});
	toggleQuotes(youHoverQuotes);
});

window.addEventListener('settingsReady', () => {

    const yousSetting = document.getElementById('yous-setting');
    const toggleYousSetting = () => {
        yousEnabled = !yousEnabled;
        setLocalStorage('yous-setting', yousEnabled);
        toggleAll();
        console.log('toggling yous', yousEnabled);
    }
    yousSetting.checked = yousEnabled;
    yousSetting.addEventListener('change', toggleYousSetting, false);

});
