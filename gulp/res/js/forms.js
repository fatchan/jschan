const modalClasses = ['modal', 'modal-bg'];
function removeModal() {
	modalClasses.forEach(c => document.getElementsByClassName(c)[0].remove());
}

function doModal(data, postcallback) {
	const modalHtml = modal({ modal: data });
	let checkInterval;
	document.body.insertAdjacentHTML('afterbegin', modalHtml);
	document.getElementById('modalclose').onclick = () => {
		removeModal();
		clearInterval(checkInterval);
	};
	document.getElementsByClassName('modal-bg')[0].onclick = () => {
		removeModal();
		clearInterval(checkInterval);
	};
	const modalframe = document.getElementById('modalframe');
	if (modalframe && postcallback) {
		checkInterval = setInterval(() => {
			if (modalframe && modalframe.contentDocument.title == 'Success') {
				clearInterval(checkInterval);
				removeModal();
				postcallback();
			}
		}, 100);
	}
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
		this.messageBox = form.querySelector('#message')
		this.submit = form.querySelector('input[type="submit"]')
		this.originalSubmitText = this.submit.value;
		this.fileInput = form.querySelector('input[type="file"]');
		this.files = [];
		if (this.fileInput) {
			this.fileRequired = this.fileInput.required;
			this.fileLabel = this.fileInput.previousSibling;
			this.multipleFiles = this.fileLabel.parentNode.previousSibling.firstChild.textContent.endsWith('s');
			this.fileLabelText = this.fileLabel.childNodes[0];
			this.fileLabel.addEventListener('dragover', e => this.fileLabelDrag(e));
			this.fileLabel.addEventListener('drop', e => this.fileLabelDrop(e));
			this.fileInput.addEventListener('change', e => this.fileInputChange(e));
			this.fileLabel.addEventListener('auxclick', e => this.fileLabelAuxclick(e));
		}
		this.messageBox.addEventListener('keydown', e => this.controlEnterSubmit(e));
		form.addEventListener('paste', e => this.paste(e));
		form.addEventListener('submit', e => this.formSubmit(e));
	}

	controlEnterSubmit(e) {
		if (e.ctrlKey && e.key === 'Enter') {
			this.formSubmit(e);
		}
	}

	formSubmit(e) {
		let postData;
		if (this.form.getAttribute('enctype') === 'multipart/form-data') {
			this.fileInput.disabled = true; //palemoon is dumb, so append them instead
			postData = new FormData(this.form);
			this.fileInput.disabled = false;
			if (this.files && this.files.length > 0) {
				//add files to file input element
				for (let i = 0; i < this.files.length; i++) {
					postData.append('file', this.files[i]);
				}
			}
		} else {
			xhr.setRequestHeader('Content-Type', 'application/json');
			postData = formToJSON(this.form);
		}
		if (this.banned) {
			return true;
		} else {
			e.preventDefault();
		}
		this.submit.disabled = true;
		const xhr = new XMLHttpRequest();
		if (this.files && this.files.length > 0) {
			//show progress on file uploads
			xhr.onloadstart = () => {
				this.submit.value = '0%';
			}
			xhr.upload.onprogress = (ev) => {
				const progress = Math.floor((ev.loaded / ev.total) * 100);
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
//todo: show success messages nicely for forms like actions (this doesnt apply to non file forms yet)
						}
					} else {
						if (socket && socket.connected) {
							window.myPostId = json.postId;
							window.location.hash = json.postId
						} else {
							if (!isThread) {
								return window.location = json.redirect;
							}
							setLocalStorage('myPostId', json.postId);
							forceUpdate();
//							window.location.reload();
						}
					}
					const savedName = this.form.elements.name && this.form.elements.name.value;
					this.form.reset();
					if (this.form.elements.name) {
						this.form.elements.name.value = savedName
					}
					if (this.form.elements.postpassword) {
						this.form.elements.postpassword.value = localStorage.getItem('postpassword');
					}
					this.updateMessageBox();
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
						doModal(json, () => {
							this.formSubmit(e);
						});
					} else {
//for bans, post form to show TODO: make modal support bans json and send dynamicresponse from it
						this.clearFiles(); //dont resubmit files
						this.banned = true;
						this.form.dispatchEvent(new Event('submit'));
					}
				}
				this.submit.value = this.originalSubmitText;
			}
		}
		xhr.onerror = (err) => {
			console.error(err); //why is this error fucking useless
			doModal({
				'title': 'Error',
				'message': 'Something broke'
			});
			this.submit.disabled = false;
		}
		xhr.open(this.form.getAttribute('method'), this.form.getAttribute('action'), true);
		xhr.setRequestHeader('x-using-xhr', true);
		const isLive = localStorage.getItem('live') == 'true' && socket && socket.connected;
		if (isLive) {
			xhr.setRequestHeader('x-using-live', true);
		}
		xhr.send(postData);
	}

	updateMessageBox() {
		this.messageBox && this.messageBox.dispatchEvent(new Event('input'));
	}

	//remove a single file, unused atm
	removeFile(index) {
		const childNode = this.fileLabel.childNodes[index+1]; //+1 because first one is fileLabelText
		childNode.remove();
		files.splice(index, 1);
	}

	addFile(file) {
		if (this.fileRequired) { //prevent drag+drop issues by removing required
			this.fileInput.removeAttribute('required');
		}
		this.files.push(file);
	}

	//show number of files on new label
	updateFilesText() {
		if (!this.fileLabelText) {
			return;
		}
		if (this.files && this.files.length === 0) {
			this.fileLabelText.nodeValue = `Select/Drop/Paste file${this.multipleFiles ? 's' : ''}`;
		} else {
			this.fileLabelText.nodeValue = `${this.files.length} file${this.files.length > 1 ? 's' : ''} selected`;
		}
	}

	//remove all files from this form
	clearFiles() {
		this.files = []; //empty file list
		this.fileInput.value = null; //remove the files for real
		if (this.fileRequired) { //reset to required if clearing files
			this.fileInput.setAttribute('required', true)
		}
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
					this.addFile(file);
				}
			}
			this.updateFilesText();
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
			this.addFile(newFiles[i]);
		}
		this.updateFilesText();
	}

	//add file by normal file form, but add instead of replacing files
	fileInputChange(e) {
		const newFiles = this.fileInput.files;
		for (let i = 0; i < newFiles.length; i++) {
			this.addFile(newFiles[i]);
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

	const myPostId = localStorage.getItem('myPostId');
	if (myPostId) {
		window.location.hash = myPostId;
		localStorage.removeItem('myPostId');
	}

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
