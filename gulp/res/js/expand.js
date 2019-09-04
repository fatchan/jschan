window.addEventListener('DOMContentLoaded', (event) => {

	var thumbs = document.getElementsByClassName('post-file-src');

	var toggle = function(thumb, exp) {
		const close = exp.previousSibling.innerText === 'Close video' ? exp.previousSibling : null;
		if (thumb.style.display === 'none') {
			thumb.style.display = '';
			exp.style.display = 'none';
			if (close) {
				close.style.display = 'none';
				exp.pause();
			}
		} else {
			thumb.style.display = 'none';
			exp.style.display = '';
			if (close) {
				close.style.display = '';
				exp.play();
			}
		}
	}

	var expand = function(e) {
		e.preventDefault();
		const fileLink = this.firstChild;
		const fileSrc = fileLink.href;
		const type = this.dataset.type;
		const thumbElement = fileLink.firstChild;
		const next = thumbElement.nextSibling;
		let expandedElement;
		if (next) {
			if (next.innerText === 'Close video') {
				expandedElement = next.nextSibling;
			} else {
				expandedElement = next;
			}
		}
		if (!expandedElement && thumbElement.style.opacity !== '0.5') {
			fileLink.style.minWidth = fileLink.offsetWidth+'px';
			fileLink.style.minHeight = fileLink.offsetHeight+'px';
			let source;
			switch(type) {
				case 'image':
					thumbElement.style.opacity = '0.5';
					expandedElement = document.createElement('img');
					source = expandedElement;
					source.onload = function() {
						thumbElement.style.opacity = '1';
						fileLink.appendChild(expandedElement);
						toggle(thumbElement, expandedElement);
					}
					break;
				case 'video':
					expandedElement = document.createElement('video');
					close = document.createElement('div');
					close.innerText = 'Close video';
					close.addEventListener('click', function(e) {
						e.preventDefault();
						e.stopPropagation();
						toggle(thumbElement, expandedElement);
					}, true);
					expandedElement.controls = 'true';
					source = document.createElement('source');
					expandedElement.appendChild(source);
					fileLink.appendChild(expandedElement);
					fileLink.insertBefore(close, expandedElement);
					toggle(thumbElement, expandedElement);
					break;
				deault:
					break; //uh oh
			}
			source.src = fileSrc;
		} else if (expandedElement) {
			toggle(thumbElement, expandedElement);
		}
		return false;
	};

	for (var i = 0; i < thumbs.length; i++) {
		thumbs[i].addEventListener('click', expand, false);
	}

});
