/* eslint-disable no-unused-vars */
class Minimisable {
	constructor(elementSelector, buttons, storageKey, resizeUpdateCb) {
		this.elementSelector = elementSelector;
		this.buttons = buttons;
		this.storageKey = storageKey;
		this.resizeUpdateCb = resizeUpdateCb; //todo: refactor out code smell
		this.minimised = this.storageKey ? localStorage.getItem(this.storageKey) === 'true' : false;
	}

	init () {
		this.element = document.querySelector(this.elementSelector);
		this.resizable = this.element.classList.contains('resize'); //make an arg to minimisable and add in here?
		this.buttonElements = this.buttons.map(button => {
			const buttonElement = this.element.querySelector(button.selector);
			buttonElement.addEventListener('click', () => this.handleButtonClick(button));
			return { ...button, element: buttonElement };
		});
		this.updateVisibility();
		this.updateButtonTexts();
	}

	handleButtonClick (button) {
		if (typeof button.cb === 'string' && this[button.cb]) {
			this[button.cb]();
		} else if (typeof button.cb === 'function') {
			button.cb();
		} else {
			this.toggleMinimise();
		}
	}

	toggleMinimise () {
		this.minimised = !this.minimised;
		if (this.minimised && this.resizable && (this.element.style.width || this.element.style.height)) {
			this.element.style.height = '';
			this.element.style.width = '';
		}
		this.resizable && this.element.classList.toggle('resize', !this.minimised);
		this.storageKey && localStorage.setItem(this.storageKey, this.minimised);
		this.updateVisibility();
		this.updateButtonTexts();
	}

	toggleMaximise () {
		if (this.element.style.width === '100%' && this.element.style.height === '100%') {
			this.element.style.width = this.originalWidth;
			this.element.style.height = this.originalHeight;
			this.element.style.top = this.originalTop;
			this.element.style.left = this.originalLeft;
			this.resizable && this.element.classList.toggle('resize', true);
		} else {
			this.originalWidth = this.element.style.width;
			this.originalHeight = this.element.style.height;
			this.originalTop = this.element.style.top;
			this.originalLeft = this.element.style.left;
			//todo: maximised class w/important?
			this.element.style.maxWidth = '';
			this.element.style.maxHeight = '';
			this.element.style.top = '0';
			this.element.style.left = '0';
			this.element.style.width = '100%';
			this.element.style.height = '100%';
			this.resizable && this.element.classList.toggle('resize', false);
		}
		this.resizeUpdateCb && this.resizeUpdateCb();
		this.minimised = false;
		this.element.classList.remove('minimised');
		this.storageKey && localStorage.setItem(this.storageKey, this.minimised);
		this.updateButtonTexts();
	}

	maximise () {
		this.toggleMaximise(); // Use toggleMaximise for maximizing
	}

	updateVisibility () {
		this.element.classList.toggle('minimised', this.minimised);
	}

	updateButtonTexts () {
		this.buttonElements.forEach(button => {
			button.element.textContent = button.falseText
				? (this[button.textVar] ? button.trueText : button.falseText)
				: button.trueText;
		});
	}

	isMinimised () {
		return this.minimised;
	}
}
