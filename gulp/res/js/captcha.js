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
		if (captcha.form && captcha.form.dataset.captchaPreload == 'true') {
			this.loadCaptcha(captcha);
		} else {
			captcha.addEventListener('mouseover', () => this.loadCaptcha(captcha), { once: true });
		}
	}

	refreshCaptchas(e) {
		if (this.refreshing) {
			return null;
		}
		this.refreshing = true;
		e && e.target.classList.add('spin');
		for (let captchacheck of document.querySelectorAll('input[name="captcha"]')) {
			captchacheck.checked=false;
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
		captchaImg.style.margin = '0 auto';
		captchaImg.style.display = 'flex';
		captchaImg.style.width = '100%';
		refreshDiv.classList.add('captcharefresh', 'noselect');
		refreshDiv.addEventListener('click', (e) => this.refreshCaptchas(e), true);
		refreshDiv.textContent = '↻';
		captchaImg.src = '/captcha';
		captchaImg.onload = function() {
				captchaDiv.appendChild(captchaImg);
				captchaDiv.appendChild(refreshDiv);
				captchaDiv.style.display = '';
		}
	}

}

const captchaController = new CaptchaController();

window.addEventListener('DOMContentLoaded', () => {

	captchaController.init();

});
