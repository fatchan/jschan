let imageSources = new Set(JSON.parse(localStorage.getItem('hiddenimages')));
let imageSourcesList;

const toggleAllHidden = (state) => imageSources.forEach(i => toggleSource(i, state));

const toggleSource = (source, state) => {
	const images = document.querySelectorAll(`img.file-thumb[src="${source}"], img.catalog-thumb[src="${source}"]`);
	images.forEach(i => i.classList[state?'add':'remove']('vh'));
}

toggleAllHidden(true);

const toggleHandler = (e) => {
	const thumbSource = e.target.dataset.src
	const hidden = imageSources.has(thumbSource);
	imageSources[hidden?'delete':'add'](thumbSource);
	imageSourcesList.value = [...imageSources];
	setLocalStorage('hiddenimages', JSON.stringify([...imageSources]));
	toggleSource(thumbSource, !hidden);
}

document.querySelectorAll('.hide-image').forEach(el => {
	el.addEventListener('click', toggleHandler, false);
});

const handleHiddenImages = (e) => {
	//hide any images from this post that should already be hidden
	const hasHiddenImages = e.detail.json.files.forEach(f => {
		let hideFilename = '/file/';
		if (f.hasThumb) {
			hideFilename += `thumb-${f.hash}${f.thumbextension}`
		} else {
			hideFilename += f.filename;
		}
		if (imageSources.has(hideFilename)) {
			toggleSource(hideFilename, true);
		}
	});
	//add the hide toggle link and event listener
	if (!e.detail.hover) {
		e.detail.post.querySelector('.hide-image').addEventListener('click', toggleHandler, false);
	}
}

window.addEventListener('addPost', handleHiddenImages, false);

window.addEventListener('settingsReady', () => {

	imageSourcesList = document.getElementById('hiddenimages-setting');
	imageSourcesList.value = [...imageSources];
	const imageSourcesListClearButton = document.getElementById('hiddenimages-clear');
	const clearImageSources = () => {
		toggleAllHidden(false);
		imageSources = new Set();
		imageSourcesList.value = '';
		setLocalStorage('hiddenimages', '[]');
		console.log('cleared hidden images list');
	}
	imageSourcesListClearButton.addEventListener('click', clearImageSources, false);

});
