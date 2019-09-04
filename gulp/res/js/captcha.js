window.addEventListener('DOMContentLoaded', (event) => {

	var captchaFields = document.getElementsByClassName('captchafield');

	var refreshCaptcha = function(e) {
		if (this.refreshing) {
			return;
		}
		this.refreshing = true;
		document.cookie = 'captchaid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		const captchaImg = this;
		const xhr = new XMLHttpRequest();
		xhr.onload = function() {
			captchaImg.src = xhr.responseURL;
			captchaImg.refreshing = false;
		}
		xhr.open('GET', '/captcha', true);
		xhr.send(null);
	}

	var loadCaptcha = function(e) {
		const captchaDiv = this.previousSibling;
		const captchaImg = document.createElement('img');
		const field = this;
		captchaImg.src = '/captcha';
		captchaImg.onload = function() {
			field.placeholder = 'captcha text';
			captchaDiv.appendChild(captchaImg);
			captchaDiv.style.display = '';
			captchaImg.addEventListener('dblclick', refreshCaptcha, true);
		}
	};

	for (var i = 0; i < captchaFields.length; i++) {
		captchaFields[i].placeholder = 'click to load';
		captchaFields[i].addEventListener('click', loadCaptcha, { once: true });
	}

});
