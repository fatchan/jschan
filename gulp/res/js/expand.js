setDefaultLocalStorage('volume', 100);
setDefaultLocalStorage('loop', false);
setDefaultLocalStorage('imageloadingbars', false);

window.addEventListener('DOMContentLoaded', (event) => {

	const actionFooter = document.querySelector('summary.toggle-summary');
	if (actionFooter) {
		actionFooter.onclick = () => {
			actionFooter.scrollIntoView();
		}
	}

	const volumeSetting = document.getElementById('volume-setting');
	let volumeLevel = localStorage.getItem('volume');
	const changeVolume = (change) => {
		volumeLevel = volumeSetting.value;
		const allMedia = document.querySelectorAll('audio,video');
		for (let i = 0; i < allMedia.length; i++) {
			allMedia[i].volume = volumeLevel/100;
		}
		console.log('adjusting default volume', volumeLevel);
		setLocalStorage('volume', volumeLevel);
	}
	volumeSetting.value = volumeLevel;
	volumeSetting.addEventListener('change', changeVolume, false);

	const loopSetting = document.getElementById('loop-setting');
	let loopEnabled = localStorage.getItem('loop') == 'true';
	const toggleLoop = (change) => {
		loopEnabled = loopSetting.checked;
		console.log('toggling video/audio looping', loopEnabled);
		setLocalStorage('loop', loopEnabled);
	}
	loopSetting.checked = loopEnabled;
	loopSetting.addEventListener('change', toggleLoop, false);

	const imageloadingbarsSetting = document.getElementById('imageloadingbars-setting');
	let imageloadingbarsEnabled = localStorage.getItem('imageloadingbars') == 'true';
	const toggleImageloadingbars = (change) => {
		imageloadingbarsEnabled = imageloadingbarsSetting.checked;
		console.log('toggling video/audio imageloadingbarsing', imageloadingbarsEnabled);
		setLocalStorage('imageloadingbars', imageloadingbarsEnabled);
	}
	imageloadingbarsSetting.checked = imageloadingbarsEnabled;
	imageloadingbarsSetting.addEventListener('change', toggleImageloadingbars, false);

	if (!isCatalog) { //dont expand on catalog
		const thumbs = document.getElementsByClassName('post-file-src');
		const toggle = function(thumb, exp, fn, src) {
			if (loopEnabled) {
				exp.loop = true;
			} else {
				exp.loop = false;
			}
			exp.volume = volumeLevel/100;
			const close = exp.previousSibling.innerText === 'Close' ? exp.previousSibling : null;
			if (thumb.style.display === 'none') {
				//closing
				thumb.style.display = '';
				exp.style.display = 'none';
				fn.style.maxWidth = '';
				if (close) {
					src.style.visibility = 'visible';
					close.style.display = 'none';
					exp.pause();
				}
			} else {
				//expanding
				thumb.style.display = 'none';
				exp.style.display = '';
				if (exp.offsetWidth >= fn.offsetWidth) {
					fn.style.maxWidth = exp.offsetWidth+'px';
				}
				if (close) {
					src.style.visibility = 'hidden';
					close.style.display = '';
					exp.play();
				}
			}
		}

		const expand = function(e) {
			const fileLink = this.firstChild;
			const fileSrc = fileLink.href;
			const type = this.dataset.type;
			if (this.dataset.attachment == 'true') {
				return; //attachments dont expand
			}
			const thumbElement = fileLink.firstChild;
			const fileName = this.previousSibling;
			const next = thumbElement.nextSibling;
			const pfs = this.closest('.post-file-src');
			let expandedElement;
			if (next) {
				if (next.innerText === 'Close') {
					expandedElement = next.nextSibling;
				} else {
					expandedElement = next;
				}
			}
			if (!expandedElement && thumbElement.style.opacity !== '0.5') {
				let source;
				fileLink.style.minWidth = fileLink.offsetWidth+'px';
				fileLink.style.minHeight = fileLink.offsetHeight+'px';
				switch(type) {
					case 'image':
						e.preventDefault();
						thumbElement.style.opacity = '0.5';
						thumbElement.style.cursor = 'wait'
// loading bar experiment
						if (localStorage.getItem('imageloadingbars') == 'true') {
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
							}
							expandedElement = document.createElement('img');
							source = expandedElement;
							//some jank here to try and recude any delay induced by xhr
							const loaded = function(e) {
								pfs.removeAttribute('data-loading');
								pfs.removeAttribute('style');
								const blob = this.response;
								source.src = window.URL.createObjectURL(blob);
								thumbElement.style.opacity = '';
								thumbElement.style.cursor = '';
								fileLink.appendChild(expandedElement);
								toggle(thumbElement, expandedElement, fileName, pfs);
							}
							request.onload = loaded;
							request.responseType = 'blob';
							request.open('GET', fileSrc, true);
							request.send(null);
						} else {
// loading bar experiment
							expandedElement = document.createElement('img');
							source = expandedElement;
							source.onload = function() {
								thumbElement.style.opacity = '';
								thumbElement.style.cursor = '';
								fileLink.appendChild(expandedElement);
								toggle(thumbElement, expandedElement, fileName, pfs);
							}
							source.src = fileSrc;
						}
						break;
					case 'video':
					case 'audio':
						e.preventDefault();
						expandedElement = document.createElement(type);
						close = document.createElement('div');
						close.innerText = 'Close';
						close.addEventListener('click', function(e) {
							e.preventDefault();
							e.stopPropagation();
							toggle(thumbElement, expandedElement, fileName, pfs);
						}, true);
						expandedElement.controls = 'true';
						source = document.createElement('source');
						expandedElement.appendChild(source);
						fileLink.appendChild(expandedElement);
						fileLink.insertBefore(close, expandedElement);
						toggle(thumbElement, expandedElement, fileName, pfs);
						source.src = fileSrc;
						break;
					deault:
						return;
				}
			} else if (expandedElement) {
				e.preventDefault();
				toggle(thumbElement, expandedElement, fileName, pfs);
			} else {
				e.preventDefault();
			}
		};

		const addExpandEvent = (t) => {
			for (let i = 0; i < t.length; i++) {
				t[i].addEventListener('click', expand, false);
			}
		}

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
