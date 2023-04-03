/* globals __ captchaOptions captchaformsection */
const captchaCookieRegex = /captchaid=(.[^;]*)/ig;
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

	captchaAge() {
		const captchaCookieMatch = document.cookie.match(captchaCookieRegex);
		if (!captchaCookieMatch) { return; }
		const cookieParams = new URLSearchParams(captchaCookieMatch[0]);
		const captchaIdCookie = cookieParams.get('captchaid');
		if (captchaIdCookie) {
			const captchaExpiry = new Date(parseInt(captchaIdCookie.slice(0,8),16)*1000);
			return (Date.now() - captchaExpiry);
		}
	}

	startRefreshTimer() {
		clearTimeout(this.refreshTimer); //this wont throw an error if its null, so no need to check
		const captchaAge = this.captchaAge();
		if (captchaAge != null) {
			console.log('Refreshing captcha in ', 300000-captchaAge);
			this.refreshTimer = setTimeout(() => {
				this.refreshCaptchas();
			}, 300000-captchaAge);
		}
	}

	setupCaptchaField(captcha) {
		if (captcha.closest('form').dataset.captchaPreload == 'true') {
			return this.loadCaptcha(captcha);
		}
		if (captchaOptions.type === 'grid' || captchaOptions.type === 'grid2') {
			let hoverListener = captcha.closest('details') || captcha;
			//captcha.parentElement.previousSibling.previousSibling.tagName === 'SUMMARY' ? captcha.parentElement.previousSibling.previousSibling :  captcha.parentElement;
			hoverListener.addEventListener('mouseover', () => this.loadCaptcha(captcha), { once: true });
		} else { //captchaOptions.type === 'text'
			captcha.placeholder = __('focus to load captcha');
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
			this.startRefreshTimer();
			for (let captcha of this.captchaFields) {
				const existingImage = captcha.previousSibling.children[0];
				if (existingImage) {
					captcha.previousSibling.children[0].src = xhr.responseURL;
				} else {
					this.loadCaptcha(captcha, xhr.responseURL);
				}
			}
			this.refreshing = false;
			e && e.target.classList.remove('spin');
		};
		xhr.onerror = () => {
			this.refreshing = false;
			e && e.target.classList.remove('spin');
		};
		xhr.open('GET', '/captcha', true);
		xhr.send(null);
	}

	removeCaptcha() {
		const postForm = document.getElementById('postform');
		const captchaField = postForm.querySelector('.captcha');
		if (captchaField) {
			//delete the whole row
			const captchaRow = captchaField.closest('.row');
			captchaRow.remove();
		}
	}

	addMissingCaptcha() {
		const postSubmitButton = document.getElementById('submitpost');
		const captchaFormSectionHtml = captchaformsection({ captchaOptions });
		postSubmitButton.insertAdjacentHTML('beforebegin', captchaFormSectionHtml);
		const captchaFormSection = postSubmitButton.previousSibling;
		const captchaField = captchaFormSection.querySelector('.captchafield');
		this.loadCaptcha(captchaField);
	}

	loadCaptcha(field, imgSrc = '/captcha') {
		const captchaDiv = field.previousSibling;
		if (captchaDiv.children.length > 0) {
			return;
		}
		const captchaImg = document.createElement('img');
		const refreshDiv = document.createElement('div');
		captchaDiv.style.display = '';
		captchaImg.style.margin = '0 auto';
		captchaImg.style.display = 'flex';
		//captchaImg.style.width = '100%';
		refreshDiv.classList.add('captcharefresh', 'noselect');
		refreshDiv.addEventListener('click', (e) => this.refreshCaptchas(e), true);
		refreshDiv.textContent = '↻';
		if (captchaOptions.type === 'text') {
			field.placeholder = __('loading');
		}
		captchaImg.src = imgSrc;
		captchaImg.onload = () => {
			if (captchaOptions.type === 'text') {
				field.placeholder = __('Captcha text');
			}
			captchaDiv.appendChild(captchaImg);
			captchaDiv.appendChild(refreshDiv);
			this.startRefreshTimer();
		};
	}

}

const captchaController = new CaptchaController();

window.addEventListener('DOMContentLoaded', () => {

	captchaController.init();

});
