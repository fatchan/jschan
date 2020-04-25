window.addEventListener('DOMContentLoaded', (event) => {

	const captchaFields = document.getElementsByClassName('captchafield');
	let refreshing = false;

	const updateCaptchaImages = (url) => {
		for (let i = 0; i < captchaFields.length; i++) {
			if (captchaFields[i].previousSibling.children.length > 0) {
				captchaFields[i].previousSibling.children[0].src = url;
			}
		}
	};

	const refreshCaptchas = function(e) {
		if (refreshing) {
			return;
		}
		refreshing = true;
		document.cookie = 'captchaid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		const captchaImg = this;
		const xhr = new XMLHttpRequest();
		xhr.onload = () => {
			refreshing = false;
			updateCaptchaImages(xhr.responseURL);
		}
		xhr.onerror = () => {
			refreshing = false;
		}
		xhr.open('GET', '/captcha', true);
		xhr.send(null);
	};

	const loadCaptcha = function(e) {
		const field = e.target;
		const captchaDiv = field.previousSibling;
		const captchaImg = document.createElement('img');
		const refreshDiv = document.createElement('div');
		refreshDiv.classList.add('captcharefresh', 'noselect');
		refreshDiv.addEventListener('click', refreshCaptchas, true);
		refreshDiv.textContent = '↻';
		field.placeholder = 'loading';
		captchaImg.src = '/captcha';
		captchaImg.onload = function() {
			field.placeholder = '';
			captchaDiv.appendChild(captchaImg);
			captchaDiv.appendChild(refreshDiv);
			captchaDiv.style.display = '';
		}
	};

	for (let i = 0; i < captchaFields.length; i++) {
		const field = captchaFields[i];
		if (field.form.action.endsWith('/forms/blockbypass')) {
			return loadCaptcha({target: field })
		}
		field.placeholder = 'focus to load captcha';
		field.addEventListener('focus', loadCaptcha, { once: true });
	}

});
