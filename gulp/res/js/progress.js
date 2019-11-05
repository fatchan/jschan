const removeModal = () => {
	document.getElementsByClassName('modal')[0].remove();
	document.getElementsByClassName('modal-bg')[0].remove();
}

const doModal = (data) => {
	const modalHtml = modal({ modal: data });
	document.body.insertAdjacentHTML('afterbegin', modalHtml);
	document.getElementById('modalclose').onclick = removeModal;
}

window.addEventListener('DOMContentLoaded', () => {

	const isThread = /\/\w+\/thread\/\d+.html/.test(window.location.pathname);

	const form = document.getElementById('postform');
	const submit = document.getElementById('submitpost');

	if (!submit || !form) {
		return; //no postform on this page
	}

	form.addEventListener('submit', function(event) {
		if (localStorage.getItem('live') != 'true') {
			return true;
		}
		event.preventDefault();
		submit.disabled = true;
		const xhr = new XMLHttpRequest();
		xhr.onloadstart = function() {
			submit.value = '0%';
		}
		xhr.upload.onprogress = function(e) {
			const progress = Math.floor((e.loaded / e.total) * 100);
			submit.value = `${progress}%`;
		}
		xhr.onload = function() {
			submit.value = 'New Reply';
		}
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4) {
				submit.disabled = false;
				let json;
				if (xhr.responseText) {
					try {
						json = JSON.parse(xhr.responseText);
					} catch (e) {
						//wasnt json response
					}
				}
				if (xhr.status == 200) {
					//successful post
					if (!isThread && xhr.responseURL) {
						window.location = xhr.responseURL;
					} else if (socket && socket.connected && json) {
						window.myPostId = json.postId;
						window.location.hash = json.postId;
					}
					form.reset(); //reset form on success
					const captcha = form.getElementsByTagName('img');
					if (captcha.length > 0) {
						captcha[0].dispatchEvent(new Event('dblclick'));
					}
				} else {
					//not 200 status, so some error/failed post, wrong captcha, etc
					if (json) {
						doModal(json);
					} else {
						//for bans, show
						window.history.pushState({}, null, xhr.responseURL);
						document.open('text/html', true);
						document.write(xhr.responseText);
						document.close();
					}
				}
				submit.value = 'New Reply';
			}
		}
		xhr.onerror = function() {
			doModal({
				'title': 'Error',
				'message': 'Something broke'
			});
			submit.disabled = false;
		}
		xhr.open(form.getAttribute('method'), form.getAttribute('action'), true);
		xhr.setRequestHeader('x-using-xhr', true);
		xhr.send(new FormData(form));
	});

	window.addEventListener('addPost', function(e) {
		if (window.myPostId == e.detail.postId) {
			window.location.hash = e.detail.postId;
		}
	});

});
