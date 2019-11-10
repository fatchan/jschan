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
	const isBanners = window.location.pathname.endsWith('banners.html');

	const form = isBanners ? document.querySelector('form') : document.getElementById('postform');
	const submit = form ? form.querySelector('input[type="submit"]') : null;

	if (!submit || !form) {
		return;
	}

	const fileInput = document.getElementById('file');
	const fileLabel = fileInput.previousSibling;
	let files = [];

	const removeFile = (name) => {
		for(let i = 1; i < fileLabel.childNodes.length; i++) {
			const childNode = fileLabel.childNodes[i];
			if (childNode.nodeValue === name) {
				childNode.nextSibling.remove();
				childNode.remove();
				files = files.filter(file => file.name !== name);
			}
		}
	}

	//show number of files on new label
	const updateFilesText = () => {
		if (files.length === 0) {
			fileLabel.innerText = 'Upload/Drop/Paste file(s)';
		} else {
			fileLabel.innerText = `${files.length} files selected`;
			//todo make x marks to remove each one with "removeFile"
		}
	}

	//remove files
	const clearFiles = () => {
		files = []; //empty file list
		fileInput.value = null; //remove the files for real
		updateFilesText();
	}

	//handle paste image from clipboard
	document.addEventListener('paste', (e) => {
		const clipboard = e.clipboardData;
		if (clipboard.items && clipboard.items.length > 0) {
			const items = clipboard.items;
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				if (item.kind === 'file') {
					const file = new File([item.getAsFile()], 'ClipboardImage.png', { type: item.type });
					files.push(file);
					updateFilesText();
				}
			}
		}
	});

	//handle drag+drop files
	fileLabel.ondragover = (e) => {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
	}
	fileLabel.ondrop = (e) => {
		e.stopPropagation();
		e.preventDefault();
		const newFiles = e.dataTransfer.files;
		for (let i = 0; i < newFiles.length; i++) {
			files.push(newFiles[i]);
		}
		updateFilesText();
	}

	//add files to list instead of replacing when regular upload
	fileInput.onchange = () => {
		fileLabel.innerText = `${fileInput.files.length} files selected`;
		const newFiles = fileInput.files;
		for (let i = 0; i < newFiles.length; i++) {
			files.push(newFiles[i]);
		}
		updateFilesText();
	}

	//middle click to clear files
	fileLabel.onauxclick = (e) => {
		if (e.button !== 1) { //middle click only
			return;
		}
		clearFiles();
	}

	form.addEventListener('submit', function(event) {

		if (files && files.length > 0) {
			//add files to file input element
			const filesToUpload = new DataTransfer();
			for (let i = 0; i < files.length; i++) {
				filesToUpload.items.add(files[i]);
			}
			fileInput.files = filesToUpload.files;
//TODO: switch this line to workaround https://stackoverflow.com/a/46780880 - http://archive.is/niUVU
		}

		if (isBanners || localStorage.getItem('live') != 'true') {
			return true;
		}

		event.preventDefault();
		submit.disabled = true; //prevent clicking post more than once

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
						return;
					} else if (socket && socket.connected && json) {
						window.myPostId = json.postId;
						window.location.hash = json.postId;
					}
					form.reset(); //reset form on success
					files = [];
					updateFilesText();
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
