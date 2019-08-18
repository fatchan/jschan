//this is so normies dont complain about multiple tabs until i make something nicer
window.addEventListener('DOMContentLoaded', (event) => {

	var thumbs = document.getElementsByClassName('post-file-src');

	var toggle = function(thumb, exp) {
		const close = exp.nextSibling;
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
		const type = this.previousSibling.lastChild.innerText.replace(/[\(\)]/g, '').split(', ')[0].trim();
		const thumbElement = fileLink.firstChild;
		let expandedElement = thumbElement.nextSibling;
		if (!expandedElement) {
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
					fileLink.appendChild(close);
					toggle(thumbElement, expandedElement);
					break;
				deault:
					break; //uh oh
			}
			source.src = fileSrc;
		} else {
			toggle(thumbElement, expandedElement);
		}
		return false;
	};

	for (var i = 0; i < thumbs.length; i++) {
		thumbs[i].addEventListener('click', expand, false);
	}

});
