let hoverExpandEnabled = localStorage.getItem('hoverExpand') === 'true';
//could use a "not attachment" queryselector?
const mediaElements = document.querySelectorAll('div.post-file-src[data-type="image"], div.post-file-src[data-type="video"], div.post-file-src[data-type="audio"]');
let hoverPopup = null;

const createHoverPopup = () => { //no need for a fucking pug compiled template for 1 dev
	hoverPopup = document.createElement('div');
	hoverPopup.id = 'hover-popup';
	document.body.appendChild(hoverPopup);
};

const updateHoverPopup = (mediaType, src, thumbElement) => {
	const mediaElement = document.createElement(mediaType === 'image' ? 'img' : mediaType);
	mediaElement.src = src;
	if (mediaType !== 'image') {
		mediaElement.controls = true;
		mediaElement.loop = true;
		mediaElement.volume = localStorage.getItem('volume')/100; //todo: necessary to change?
		mediaElement.play();
		if (mediaType === 'audio' && thumbElement) {
            mediaElement.style.backgroundImage = `url("${encodeURI(thumbElement.src)}")`
            mediaElement.style.backgroundRepeat = 'no-repeat'
            mediaElement.style.backgroundPosition = 'top'
            mediaElement.style.backgroundSize = 'contain'
            mediaElement.style.minWidth = `${thumbElement.width}px`
            mediaElement.style.paddingTop = `${thumbElement.height}px`
		}
	}

	hoverPopup.appendChild(mediaElement);
	hoverPopup.style.display = 'block';
};

const hideHoverPopup = () => {
	if (hoverPopup) {
		while (hoverPopup.firstChild) {
			hoverPopup.removeChild(hoverPopup.firstChild); //remove all children
		}
		hoverPopup.style.display = 'none';
	}
};

const handleMouseOver = (event) => {
	if (!hoverExpandEnabled) { return; }
	const thumbElement = event.currentTarget.querySelector('.file-thumb');
	if (thumbElement && thumbElement.style.display === 'none') { return; }
	const mediaType = event.currentTarget.dataset.type;
	const mediaLink = event.currentTarget.querySelector('a').href;
	updateHoverPopup(mediaType, mediaLink, thumbElement);
};

const toggleHoverExpand = () => {
	hoverExpandEnabled = !hoverExpandEnabled;
	localStorage.setItem('hoverExpand', hoverExpandEnabled);
	console.log('hover expand setting:', hoverExpandEnabled);
};

const attachHoverListeners = (elements) => {
	elements.forEach(media => {
		media.addEventListener('mouseover', handleMouseOver);
		media.addEventListener('mouseout', hideHoverPopup);
		media.addEventListener('click', hideHoverPopup);
	});
};

window.addEventListener('settingsReady', function() {
	const hoverExpandSetting = document.getElementById('hover-expand-setting');
	hoverExpandSetting.checked = hoverExpandEnabled;
	hoverExpandSetting.addEventListener('change', toggleHoverExpand, false);

	createHoverPopup();
	attachHoverListeners(mediaElements);
});

window.addEventListener('addPost', function(e) {
	const newMediaElements = e.detail.post.querySelectorAll('.post-file-src[data-type="image"], .post-file-src[data-type="video"], .post-file-src[data-type="audio"]');
	attachHoverListeners(newMediaElements);
});

