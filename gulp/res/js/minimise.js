/* eslint-disable no-unused-vars */
class Minimisable {
	constructor(elementSelector, toggleButtonSelector, storageKey) {
		this.elementSelector = elementSelector;
		this.toggleButtonSelector = toggleButtonSelector;
		this.storageKey = storageKey;
		this.minimised = this.storageKey ? localStorage.getItem(this.storageKey) === 'true' : false;
	}

	//because maybe we want to read the state before it has to attach to any existing element
	init() {
		this.element = document.querySelector(this.elementSelector);
		this.resizable = this.element.classList.contains('resize');
		this.toggleButton = this.element.querySelector(this.toggleButtonSelector);
		this.updateVisibility();
		this.updateButtonText();
		this.toggleButton.addEventListener('click', () => this.toggleMinimise());
	}

	toggleMinimise() {
		this.minimised = !this.minimised;
		//todo: make more generalised for other elements inside a minimisable
		if (this.minimised
			&& this.resizable
			&& (this.element.style.width || this.element.style.height)) {
			//for resisable minimisable elements
			this.element.style.height = '';
			this.element.style.width = '';
		}
		this.element.classList.toggle('resize', !this.minimised);
		this.storageKey && localStorage.setItem(this.storageKey, this.minimised);
		this.updateVisibility();
		this.updateButtonText();
	}

	updateVisibility() {
		this.element.classList.toggle('minimised', this.minimised);
	}

	updateButtonText() {
		this.toggleButton.textContent = this.minimised ? '[+]' : '[−]';
	}

	isMinimised() { //should i use a get (proper getter) yet?
		return this.minimised;
	}
}
