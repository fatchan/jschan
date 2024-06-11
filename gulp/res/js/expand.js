/* globals setLocalStorage isCatalog */
window.addEventListener('DOMContentLoaded', () => {

	const actionFooter = document.querySelector('#action-menu');
	if (actionFooter) {
		actionFooter.addEventListener('click', () => {
			if (!actionFooter.parentElement.classList.contains('floatactions')) {
				actionFooter.scrollIntoView();
			} else {
				actionFooter.parentElement.classList.remove('floatactions');
			}
		}, false);
	}

	const volumeSetting = document.getElementById('volume-setting');
	let volumeLevel = localStorage.getItem('volume');
	const changeVolume = () => {
		volumeLevel = volumeSetting.value;
		const allMedia = document.querySelectorAll('audio,video');
		for (let i = 0; i < allMedia.length; i++) {
			allMedia[i].volume = volumeLevel/100;
		}
		console.log('adjusting default volume', volumeLevel);
		setLocalStorage('volume', volumeLevel);
	};
	volumeSetting.value = volumeLevel;
	volumeSetting.addEventListener('change', changeVolume, false);

	const loopSetting = document.getElementById('loop-setting');
	let loopEnabled = localStorage.getItem('loop') == 'true';
	const toggleLoop = () => {
		loopEnabled = loopSetting.checked;
		console.log('toggling video/audio looping', loopEnabled);
		setLocalStorage('loop', loopEnabled);
	};
	loopSetting.checked = loopEnabled;
	loopSetting.addEventListener('change', toggleLoop, false);

	const imageloadingbarsSetting = document.getElementById('imageloadingbars-setting');
	let imageloadingbarsEnabled = localStorage.getItem('imageloadingbars') == 'true';
	const toggleImageloadingbars = () => {
		imageloadingbarsEnabled = imageloadingbarsSetting.checked;
		console.log('toggling video/audio imageloadingbarsing', imageloadingbarsEnabled);
		setLocalStorage('imageloadingbars', imageloadingbarsEnabled);
	};
	imageloadingbarsSetting.checked = imageloadingbarsEnabled;
	imageloadingbarsSetting.addEventListener('change', toggleImageloadingbars, false);

	if (!isCatalog) { //dont expand on catalog
		const thumbs = document.getElementsByClassName('post-file-src');
		const toggle = function(thumb, expanded, filename, src) {
			if (thumb.style.display === 'none') { //closing
				thumb.style.display = '';
				expanded.style.display = 'none';
				filename.style.maxWidth = '';
			} else { //expanding
				thumb.style.display = 'none';
				expanded.style.display = '';
				if (expanded.offsetWidth >= filename.offsetWidth) {
					filename.style.maxWidth = expanded.offsetWidth+'px';
				}
			}
			//handle css thing for play icon on vid/audio
			const close = thumb.nextSibling.textContent === '[Close]' ? thumb.nextSibling : null;
			if (close) {
				expanded.loop = loopEnabled;
				expanded.volume = volumeLevel/100;
				if (src.style.visibility === 'hidden') {
					src.style.visibility = 'visible';
					close.style.display = 'none';
					expanded.pause();
				} else {
					src.style.visibility = 'hidden';
					close.style.display = 'block';
					expanded.play();
				}
			}
		};

		const expand = function(e) {
			if (e.target.nodeName === 'VIDEO' || e.target.nodeName === 'AUDIO') {
				e.stopPropagation();
				return;
			}
			if (this.dataset.attachment == 'true') {
				return;
			}
			e.preventDefault();
			const fileAnchor = this.firstChild;
			const fileHref = fileAnchor.href;
			const type = this.dataset.type;
			const thumbElement = fileAnchor.firstChild;
			const isSpoilered = thumbElement.classList.contains('spoilerimg');
			const fileName = this.previousSibling;
			const pfs = this.closest('.post-file-src');
			let expandedElement = type === 'image' ? thumbElement.nextSibling : fileAnchor.nextSibling;

			if (expandedElement) {
				toggle(thumbElement, expandedElement, fileName, pfs);
			} else if (thumbElement.style.opacity !== '0.5') {
				let source;
				switch (type) {
					case 'image':
						e.preventDefault();
						if (!isSpoilered) {
							fileAnchor.style.minWidth = fileAnchor.offsetWidth+'px';
							fileAnchor.style.minHeight = fileAnchor.offsetHeight+'px';
						}
						thumbElement.style.opacity = '0.5';
						thumbElement.style.cursor = 'wait';
						if (localStorage.getItem('imageloadingbars') == 'true'
							&& window.URL.createObjectURL) {
							const request = new XMLHttpRequest();
							request.onprogress = (e) => {
								const progress = Math.floor((e.loaded/e.total)*100);
								const progressWidth = Math.floor((e.loaded/e.total)*thumbElement.offsetWidth);
								if (progress >= 100) {
									pfs.removeAttribute('data-loading');
								} else {
									pfs.setAttribute('data-loading', progress);
									pfs.style = `--data-loading: ${progressWidth}px`;
								}
							};
							expandedElement = document.createElement('img');
							source = expandedElement;
							const loaded = function() {
								pfs.removeAttribute('data-loading');
								pfs.removeAttribute('style');
								const blob = this.response;
								source.onload = function() {
									thumbElement.style.opacity = '';
									thumbElement.style.cursor = '';
									fileAnchor.appendChild(expandedElement);
									toggle(thumbElement, expandedElement, fileName, pfs);
								};
								source.src = window.URL.createObjectURL(blob);
							};
							request.onload = loaded;
							request.responseType = 'blob';
							request.open('GET', fileHref, true);
							request.send(null);
						} else {
							expandedElement = document.createElement('img');
							source = expandedElement;
							source.onload = function() {
								thumbElement.style.opacity = '';
								thumbElement.style.cursor = '';
								fileAnchor.appendChild(expandedElement);
								toggle(thumbElement, expandedElement, fileName, pfs);
							};
							source.src = fileHref;
						}
						break;
					case 'video':
					case 'audio': {
						e.preventDefault();
						expandedElement = document.createElement(type);
						const closeSpan = document.createElement('span');
						const openBracket = document.createTextNode('[');
						const closeLink = document.createElement('a');
						const closeBracket = document.createTextNode(']');
						closeSpan.classList.add('noselect', 'bold');
						closeSpan.style.marginBottom = '3px';
						closeSpan.style.display = 'block';
						closeSpan.style.color = 'var(--font-color)';
						closeLink.classList.add('dummy-link');
						closeLink.textContent = 'Close';
						closeSpan.appendChild(openBracket);
						closeSpan.appendChild(closeLink);
						closeSpan.appendChild(closeBracket);
						closeSpan.addEventListener('click', function(e) {
							e.preventDefault();
							e.stopPropagation();
							toggle(thumbElement, expandedElement, fileName, pfs);
						}, true);
						expandedElement.controls = 'true';
						source = document.createElement('source');
						expandedElement.appendChild(source);
						expandedElement.setAttribute('playsinline', '');
						if (type === 'audio' && thumbElement.nodeName === 'IMG') {
							expandedElement.style.backgroundImage =
								`url("${encodeURI(thumbElement.src)}")`;
							expandedElement.style.backgroundRepeat = 'no-repeat';
							expandedElement.style.backgroundPosition = 'top';
							expandedElement.style.backgroundSize = 'contain';
							expandedElement.style.minWidth = thumbElement.width+'px';
							expandedElement.style.paddingTop = thumbElement.height+'px';
						} else if (!isSpoilered) {
							expandedElement.style.minWidth = fileAnchor.offsetWidth+'px';
							expandedElement.style.minHeight = fileAnchor.offsetHeight+'px';
						}
						pfs.appendChild(expandedElement);
						fileAnchor.appendChild(closeSpan);
						toggle(thumbElement, expandedElement, fileName, pfs);
						source.src = fileHref;
						return;
					}
				}
			}
		};

		const addExpandEvent = (t) => {
			for (let i = 0; i < t.length; i++) {
				t[i].addEventListener('click', expand, false);
			}
		};

		addExpandEvent(thumbs);

		window.addEventListener('addPost', function(e) {
			if (e.detail.hover) {
				return; //dont need to handle hovered posts for this
			}
			const post = e.detail.post;
			const newthumbs = post.getElementsByClassName('post-file-src');
			addExpandEvent(newthumbs);
		});
	}

});
