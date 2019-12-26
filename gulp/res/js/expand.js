setDefaultLocalStorage('volume', 100);
!localStorage.getItem('volume') ? setLocalStorage('volume', 100) : void 0;

window.addEventListener('DOMContentLoaded', (event) => {

	const actionFooter = document.querySelector('summary.toggle-summary');
	if (actionFooter) {
		actionFooter.onclick = () => {
			actionFooter.scrollIntoView();
		}
	}

	if (!isCatalog) {
		const thumbs = document.getElementsByClassName('post-file-src');

		const volumeSetting = document.getElementById('volume-setting');
		let volumeLevel = localStorage.getItem('volume');
		const changeVolume = (change) => {
			volumeLevel = volumeSetting.value;
			console.log('adjusting volume', volumeLevel);
			setLocalStorage('volume', volumeLevel);
		}
		volumeSetting.value = volumeLevel;
		volumeSetting.addEventListener('change', changeVolume, false);

		const toggle = function(thumb, exp, fn, src) {
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
						expandedElement.volume = volumeLevel/100;
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

		const dontexpand = (e) => {
			e.preventDefault();
		}

		const addExpandEvent = (t) => {
			for (let i = 0; i < t.length; i++) {
				const type = t[i].dataset.type;
				const thumb = t[i].firstChild.firstChild;
				const thumbsrc = thumb.getAttribute('src');
				if (type !== 'image' || thumbsrc.startsWith('/img/thumb') || thumbsrc.startsWith('/img/spoiler')) {
					//non-images, non-spoiler s and images with thumnbs are expanded
					t[i].addEventListener('click', expand, false);
				} else {
					//otherwise (too small images), dont expand. add dummy event to stop opening in new tab
					t[i].addEventListener('click', dontexpand, false);
				}
			}
		}

		addExpandEvent(thumbs)

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
