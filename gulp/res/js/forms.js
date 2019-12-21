const modalClasses = ['modal', 'modal-bg'];
function removeModal() {
	modalClasses.forEach(c => document.getElementsByClassName(c)[0].remove());
}

function doModal(data) {
	const modalHtml = modal({ modal: data });
	document.body.insertAdjacentHTML('afterbegin', modalHtml);
	document.getElementById('modalclose').onclick = removeModal;
	document.getElementsByClassName('modal-bg')[0].onclick = removeModal;
}

function doTextResponse(text, url) {
	window.history.pushState({}, null, url);
	document.open('text/html', true);
	document.write(text);
	document.close();
}

const checkTypes = ['checkbox', 'radio'];
function isCheckBox(element) {
	return checkTypes.includes(element.type)
}

function formToJSON(form) {
	const data = {};
	for (element of form.elements) {
		if (element.name && element.value && (!isCheckBox(element) || element.checked)) {
			if (isCheckBox(element) && data[element.name]) {
				if (Array.isArray(data[element.name])) {
					data[element.name] = data[element.name].push(element.value);
				} else {
					data[element.name] = [data[element.name], element.value];
				}
			} else {
				data[element.name] = element.value;
			}
		}
	}
	return JSON.stringify(data);
}

class formHandler {

	constructor(form) {
		this.form = form;
		this.submit = form.querySelector('input[type="submit"]')
		this.originalSubmitText = this.submit.value;
		this.fileInput = form.querySelector('input[type="file"]');
		this.files = [];
		if (this.fileInput) {
			this.fileLabel = this.fileInput.previousSibling;
			this.fileLabelText = this.fileLabel.childNodes[0];
			this.fileLabel.addEventListener('dragover', e => this.fileLabelDrag(e));
			this.fileLabel.addEventListener('drop', e => this.fileLabelDrop(e));
			this.fileInput.addEventListener('change', e => this.fileInputChange(e));
			this.fileLabel.addEventListener('auxclick', e => this.fileLabelAuxclick(e));
		}
		form.addEventListener('paste', e => this.paste(e));
		form.addEventListener('submit', e => this.formSubmit(e));
	}

	formSubmit(e) {
		if (this.files && this.files.length > 0) {
			//add files to file input element
			const filesToUpload = new DataTransfer();
			for (let i = 0; i < this.files.length; i++) {
				filesToUpload.items.add(this.files[i]);
			}
			this.fileInput.files = filesToUpload.files;
		}
		let isLive = localStorage.getItem('live') == 'true' && socket && socket.connected;
		if (!isLive) {
			return true;
		}
		e.preventDefault();
		this.submit.disabled = true;
		const xhr = new XMLHttpRequest();
		if (this.files && this.files.length > 0) {
			//show progress on file uploads
			xhr.onloadstart = () => {
				this.submit.value = '0%';
			}
			xhr.upload.onprogress = (e) => {
				const progress = Math.floor((e.loaded / e.total) * 100);
				this.submit.value = `${progress}%`;
			}
			xhr.onload = () => {
				this.submit.value = this.originalSubmitText;
			}
		}
		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				this.submit.disabled = false;
				let json;
				if (xhr.responseText) {
					try {
						json = JSON.parse(xhr.responseText);
					} catch (e) {
						//wasnt json response
					}
				}
				if (xhr.status == 200) {
					if (!json) {
						if (xhr.responseURL 
							&& xhr.responseURL !== `${location.origin}${this.form.getAttribute('action')}`) {
							window.location = xhr.responseURL;
							return;
						} else if (xhr.responseText) {
							//success page e.g. actions
							return doTextResponse(xhr.responseText, xhr.resoponseURL);
						}
					} else {
						if (json.postId && socket && socket.connected) {
							window.myPostId = json.postId;
							window.location.hash = json.postId;
						} else if (json.redirect) {
							window.location = json.redirect;
						}
					}
					this.form.reset();
					this.files = [];
					this.updateFilesText();
					const captcha = this.form.querySelector('img');
					if (captcha) {
						captcha.dispatchEvent(new Event('dblclick'));
					}
				} else {
					if (xhr.status === 413) {
						this.clearFiles();
					}
					//not 200 status, so some error/failed post, wrong captcha, etc
					if (json) {
						doModal(json);
					} else {
						//for bans, show
						return doTextResponse(xhr.responseText, xhr.resoponseURL);
					}
				}
				this.submit.value = this.originalSubmitText;
			}
		}
		xhr.onerror = () => {
			doModal({
				'title': 'Error',
				'message': 'Something broke'
			});
			this.submit.disabled = false;
		}
		xhr.open(this.form.getAttribute('method'), this.form.getAttribute('action'), true);
		xhr.setRequestHeader('x-using-xhr', true);
		let postData;
		if (this.form.getAttribute('enctype') === 'multipart/form-data') {
			postData = new FormData(this.form);
		} else {
			xhr.setRequestHeader('Content-Type', 'application/json');
			postData = formToJSON(this.form);
		}
		xhr.send(postData);
	}

	//remove a single file, unused atm
	removeFile(name) {
		for(let i = 1; i < this.fileLabel.childNodes.length; i++) {
			const childNode = this.fileLabel.childNodes[i];
			if (childNode.nodeValue === name) {
				//w about multiple w same name?
				childNode.nextSibling.remove();
				childNode.remove();
				files = files.filter(file => file.name !== name);
			}
		}
	}

	//show number of files on new label
	updateFilesText() {
		if (!this.fileLabelText) {
			return;
		}
		if (this.files && this.files.length === 0) {
			this.fileLabelText.nodeValue = 'Upload/Drop/Paste file(s)';
		} else {
			this.fileLabelText.nodeValue = `${this.files.length} file${this.files.length > 1 ? 's' : ''} selected`;
		}
	}

	//remove all files from this form
	clearFiles() {
		this.files = []; //empty file list
		this.fileInput.value = null; //remove the files for real
		this.updateFilesText();
	}

	//paste file from clipboard
	paste(e) {
		const clipboard = e.clipboardData;
		if (clipboard.items && clipboard.items.length > 0) {
			const items = clipboard.items;
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				if (item.kind === 'file') {
					const file = new File([item.getAsFile()], 'ClipboardImage.png', { type: item.type });
					this.files.push(file);
					this.updateFilesText();
				}
			}
		}
	}

	//change cursor on hover
	fileLabelDrag(e) {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
	}

	//add file on drag+drop
	fileLabelDrop(e) {
		e.stopPropagation();
		e.preventDefault();
		const newFiles = e.dataTransfer.files;
		for (let i = 0; i < newFiles.length; i++) {
			this.files.push(newFiles[i]);
		}
		this.updateFilesText();
	}

	//add file by normal file form, but add instead of replacing files
	fileInputChange(e) {
		const newFiles = this.fileInput.files;
		for (let i = 0; i < newFiles.length; i++) {
			this.files.push(newFiles[i]);
		}
		this.updateFilesText();
	}

	//middle click to clear files
	fileLabelAuxclick(e) {
		if (e.button !== 1) { //middle click only
			return;
		}
		this.clearFiles();
	}

}

window.addEventListener('DOMContentLoaded', () => {

	const forms = document.getElementsByTagName('form');
	for(let i = 0; i < forms.length; i++) {
		if (forms[i].method === 'post'
			&& forms[i].encoding === 'multipart/form-data') {
			//used only for file posting forms currently.
			new formHandler(forms[i]);
		}
	}

	window.addEventListener('addPost', (e) => {
		if (e.detail.hover) {
			return; //dont need to handle hovered posts for this
		}
		if (window.myPostId == e.detail.postId) {
			window.location.hash = e.detail.postId;
		}
	});

});
