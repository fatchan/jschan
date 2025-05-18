/* globals setLocalStorage */
class Dragable {

	constructor(handle, target, updateCallback) {
		this.updateCallback = updateCallback;
		this.draging = false;
		this.xo = 0;
		this.yo = 0;
		this.targetId = target;
		this.handle = document.querySelector(handle);
		this.target = document.querySelector(target);
		const savedTop = localStorage.getItem(`${this.targetId}-dragtop`);
		if (savedTop != 'null') {
			this.target.style.top = savedTop;
			this.target.style.bottom = 'unset';
		}
		const savedLeft = localStorage.getItem(`${this.targetId}-dragleft`);
		if (savedLeft != 'null') {
			this.target.style.left = savedLeft;
		}
		this.target.style.right = 'unset';
		this.target.addEventListener('opened', e => this.updateMaxSizes(e));
		this.handle.addEventListener('mousedown', e => this.startDrag(e));
		this.handle.addEventListener('touchstart', e => this.startDrag(e), { passive: true });
		document.addEventListener('mouseup', e => this.stopDrag(e));
		document.addEventListener('touchend', e => this.stopDrag(e));
		window.addEventListener('resize', e => this.updateMaxSizes(e));
		//when resize: all css is used
		['mousedown', 'mousemove', 'mouseup', 'touchstart', 'click']
			.forEach(event => this.target.addEventListener(event, () => this.updateCallback && this.updateCallback()));
		window.addEventListener('orientationchange', e => this.updateMaxSizes(e));
		this.updateCallback && this.updateCallback();
	}

	//get a position in bounds
	inBounds(pos, offset, size, limit) {
		if (pos - offset <= 0) {
			return 0;
		} else if (pos - offset + size > limit) {
			return limit - size;
		} else {
			return pos - offset;
		}
	}

	updateMaxSizes() {
		let rect = this.target.getBoundingClientRect();
		if (rect.width === 0) {
			return;
		}
		//reset to top left if resized or rotated and and edge goes off the screen
		if (rect.right > document.documentElement.clientWidth) {
			this.target.style.left = 0;
		}
		if (rect.bottom > document.documentElement.clientHeight) {
			this.target.style.top = 0;
		}
		//set max widths, get rect again since it might have changed
		rect = this.target.getBoundingClientRect();
		this.target.style.maxHeight = `${document.documentElement.clientHeight - rect.top}px`;
		this.target.style.maxWidth = `${document.documentElement.clientWidth - rect.left}px`;
		this.updateCallback && this.updateCallback();
	}

	//start drag and attach appropriate listener for click/drag
	startDrag(e) {
		this.draging = true;
		this.handle.style.cursor = 'grabbing';
		this.target.style.position = 'fixed';
		const rect = this.target.getBoundingClientRect();
		switch (e.type) {
			case 'mousedown':
				this.xo = e.clientX - rect.left;
				this.yo = e.clientY - rect.top;
				window.addEventListener('mousemove', e => this.doDrag(e));
				break;
			case 'touchstart':
				e.preventDefault();
				e.stopPropagation();
				this.xo = e.targetTouches[0].clientX - rect.left;
				this.yo = e.targetTouches[0].clientY - rect.top;
				window.addEventListener('touchmove', e => this.doDrag(e));
				break;
			default:
				//user has alien technology
				break;
		}
	}

	//do the actual drag/movement
	doDrag(e) {
		if (!this.draging) {
			return;
		}
		this.updateMaxSizes();
		this.target.style.bottom = 'unset';
		switch (e.type) {
			case 'mousemove':
				this.target.style.left = `${this.inBounds(e.clientX, this.xo, this.target.offsetWidth, document.documentElement.clientWidth)}px`;
				this.target.style.top = `${this.inBounds(e.clientY, this.yo, this.target.offsetHeight, document.documentElement.clientHeight)}px`;
				break;
			case 'touchmove':
				e.preventDefault();
				e.stopPropagation();
				this.target.style.left = `${this.inBounds(e.targetTouches[0].clientX, this.xo, this.target.offsetWidth, document.documentElement.clientWidth)}px`;
				this.target.style.top = `${this.inBounds(e.targetTouches[0].clientY, this.yo, this.target.offsetHeight, document.documentElement.clientHeight)}px`;
				break;
			default:
				break;
		}
		this.target.style.bottom = 'unset';
		setLocalStorage(`${this.targetId}-dragtop`, this.target.style.top);
		setLocalStorage(`${this.targetId}-dragleft`, this.target.style.left);
		this.updateCallback && this.updateCallback();
	}

	//stopped dragging
	stopDrag() {
		if (this.draging) {
			this.handle.style.cursor = 'grab';
			window.removeEventListener('mousemove', e => this.doDrag(e));
			window.removeEventListener('touchmove', e => this.doDrag(e));
		}
		this.draging = false;
	}

}

if (document.getElementById('postform')) {
	new Dragable('#postform-dragHandle', '#postform');
}
