class CaptchaController {

	constructor() {
		this.captchaFields = [];
		this.refreshing = false;
	}

	init() {
		this.captchaFields = document.getElementsByClassName('captchafield');
		this.refreshing = false;
		for (let captcha of this.captchaFields) {
			this.setupCaptchaField(captcha);
		}
	}

	setupCaptchaField(captcha) {

		if (captcha.closest('form').dataset.captchaPreload == 'true') {
			return this.loadCaptcha(captcha);
		}

		if (captchaType === 'grid') {
			let hoverListener = captcha.closest('details') || captcha;
			//captcha.parentElement.previousSibling.previousSibling.tagName === 'SUMMARY' ? captcha.parentElement.previousSibling.previousSibling :  captcha.parentElement;
			hoverListener.addEventListener('mouseover', () => this.loadCaptcha(captcha), { once: true });
		} else {
			captcha.placeholder = 'focus to load captcha';
			captcha.addEventListener('focus', () => this.loadCaptcha(captcha), { once: true });
		}
	}

	refreshCaptchas(e) {
		if (this.refreshing) {
			return null;
		}
		this.refreshing = true;
		e && e.target.classList.add('spin');
		for (let captchacheck of document.querySelectorAll('input[name="captcha"]')) {
			captchacheck.checked = false;
		}
		document.cookie = 'captchaid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		const xhr = new XMLHttpRequest();
		xhr.onload = () => {
			for (let captcha of this.captchaFields) {
				const existingImage = captcha.previousSibling.children[0];
				if (existingImage) {
					captcha.previousSibling.children[0].src = xhr.responseURL;
				}
			}
			this.refreshing = false;
			e && e.target.classList.remove('spin');
		}
		xhr.onerror = () => {
			this.refreshing = false;
			e && e.target.classList.remove('spin');
		}
		xhr.open('GET', '/captcha', true);
		xhr.send(null);
	}

	addMissingCaptcha() {
		const postSubmitButton = document.getElementById('submitpost');
		const captchaFormSectionHtml = captchaformsection();
		postSubmitButton.insertAdjacentHTML('beforebegin', captchaFormSectionHtml);
		const captchaFormSection = postSubmitButton.previousSibling;
		const captchaField = captchaFormSection.querySelector('.captchafield');
		this.loadCaptcha(captchaField);
	}

	loadCaptcha(field) {
		const captchaDiv = field.previousSibling;
		const captchaImg = document.createElement('img');
		const refreshDiv = document.createElement('div');
		captchaDiv.style.display = '';
		captchaImg.style.margin = '0 auto';
		captchaImg.style.display = 'flex';
		captchaImg.style.width = '100%';
		refreshDiv.classList.add('captcharefresh', 'noselect');
		refreshDiv.addEventListener('click', (e) => this.refreshCaptchas(e), true);
		refreshDiv.textContent = '↻';
		field.placeholder = 'loading';
		captchaImg.src = '/captcha';
		captchaImg.onload = function() {
				field.placeholder = '';
				captchaDiv.appendChild(captchaImg);
				captchaDiv.appendChild(refreshDiv);
		}
	}

}

const captchaController = new CaptchaController();

window.addEventListener('DOMContentLoaded', () => {

	captchaController.init();

});
