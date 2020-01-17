setDefaultLocalStorage('volume', 100);
setDefaultLocalStorage('loop', false);
setDefaultLocalStorage('heightlimit', true);
setDefaultLocalStorage('crispimages', false);

window.addEventListener('DOMContentLoaded', (event) => {

	const actionFooter = document.querySelector('summary.toggle-summary');
	if (actionFooter) {
		actionFooter.onclick = () => {
			actionFooter.scrollIntoView();
		}
	}

	const crispSetting = document.getElementById('crispimages-setting');
	let crispEnabled = localStorage.getItem('crispimages') == 'true';
	const normCss = 'img{image-rendering:auto}';
	const crispCss = 'img{image-rendering:crisp-edges}';
	const mainSheet = document.querySelector('link[rel="stylesheet"]').sheet;
	const insertImgCss = () => {
		mainSheet.insertRule(crispEnabled ? crispCss : normCss);
	}
	insertImgCss();
	const changeCrispSetting = (change) => {
		crispEnabled = crispSetting.checked;
		mainSheet.removeRule(0);
		insertImgCss();
		console.log('setting images crisp', crispEnabled);
		setLocalStorage('crispimages', crispEnabled);
	}
	crispSetting.checked = crispEnabled;
	crispSetting.addEventListener('change', changeCrispSetting, false);

	const volumeSetting = document.getElementById('volume-setting');
	let volumeLevel = localStorage.getItem('volume');
	const changeVolume = (change) => {
		volumeLevel = volumeSetting.value;
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

	const heightlimitSetting = document.getElementById('heightlimit-setting');
	let heightlimitEnabled = localStorage.getItem('heightlimit') == 'true';
	const toggleHeightlimit = (change) => {
		heightlimitEnabled = heightlimitSetting.checked;
		console.log('toggling image height limit', heightlimitEnabled);
		setLocalStorage('heightlimit', heightlimitEnabled);
	}
	heightlimitSetting.checked = heightlimitEnabled;
	heightlimitSetting.addEventListener('change', toggleHeightlimit, false);

	if (!isCatalog) { //dont expand on catalog
		const thumbs = document.getElementsByClassName('post-file-src');
		const toggle = function(thumb, exp, fn, src) {
			if (loopEnabled) {
				exp.loop = true;
			} else {
				exp.loop = false;
			}
			if (!heightlimitEnabled) {
				exp.classList.add('mh-100');
			} else {
				exp.classList.remove('mh-100');
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
			e.preventDefault();
			const fileLink = this.firstChild;
			const fileSrc = fileLink.href;
			const type = this.dataset.type;
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
						thumbElement.style.opacity = '0.5';
						thumbElement.style.cursor = 'wait'
						expandedElement = document.createElement('img');
						source = expandedElement;
						source.onload = function() {
							thumbElement.style.opacity = '';
							thumbElement.style.cursor = '';
							fileLink.appendChild(expandedElement);
							toggle(thumbElement, expandedElement, fileName, pfs);
						}
						break;
					case 'video':
					case 'audio':
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
						break;
					deault:
						break; //uh oh
				}
				source.src = fileSrc;
			} else if (expandedElement) {
				toggle(thumbElement, expandedElement, fileName, pfs);
			}
			return false;
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
