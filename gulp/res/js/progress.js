window.addEventListener('DOMContentLoaded', () => {

	const isThread = /\/\w+\/thread\/\d+.html/.test(window.location.pathname);

	const form = document.getElementById('postform');
	const submit = document.getElementById('submitpost');

	form.addEventListener('submit', function(event) {
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
				if (xhr.status == 200) {
					//successful post
					if (!isThread && xhr.responseURL) {
						window.location = xhr.responseURL;
					} else if (xhr.responseText) {
						const json = JSON.parse(xhr.responseText);
						window.myPostId = json.postId;
						window.location.hash = json.postId;
					}
				} else {
					if (xhr.responseText) {
						//some error/failed post, wrong captcha, etc
						document.open('text/html', true);
						document.write(xhr.responseText);
						document.close();
						window.history.pushState(null, null, xhr.responseURL);
					}
				}
				form.reset();
				submit.value = 'New Reply';
			}
		}
		xhr.onerror = function() {
			submit.value = 'Error';
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
