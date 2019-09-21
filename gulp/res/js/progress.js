/* i cent get the FUCKING headers from the 302 and  the responseURL strips the fragment? wtf
window.addEventListener('DOMContentLoaded', () => {

	var form = document.getElementById('postform');
	var submit = document.getElementById('submitpost');

	var xhr = new XMLHttpRequest();

	form.addEventListener('submit', function(event) {
		event.preventDefault();

		xhr.onloadstart = function() {
			submit.value = '0%';
		}

		xhr.upload.onprogress = function(e) {
			var progress = Math.floor((e.loaded / e.total) * 100);
			submit.value = `${progress}%`;
		}

		xhr.onload = function() {
			submit.value = 'Posting...';
		}

		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4) {
				if (xhr.status == 200 && xhr.responseURL) {
					window.location = xhr.responseURL;
				} else {
					if (xhr.responseText) {
						document.open('text/html', true);
						document.write(xhr.responseText);
						document.close();
						window.history.pushState(null, null, xhr.responseURL);
					}
				}
			}
		}

		xhr.onerror = function() {
			submit.value = 'Error';
		}


		xhr.open(form.getAttribute('method'), form.getAttribute('action'), true);

		xhr.send(new FormData(form));

	});

});
*/
