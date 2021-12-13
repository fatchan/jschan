const forms = document.getElementsByTagName('form');
const modalClasses = ['modal', 'modal-bg'];
function removeModal() {
	modalClasses.forEach(c => document.getElementsByClassName(c)[0].remove());
}

async function videoThumbnail(file) {
	return new Promise((resolve, reject) => {
		const hiddenVideo = document.createElement('video');
		hiddenVideo.setAttribute('src', URL.createObjectURL(file));
		hiddenVideo.load();
		hiddenVideo.addEventListener('error', err => {
			reject(err);
		});
		hiddenVideo.addEventListener('loadedmetadata', () => {
			//apparently 'loadedmetadata' is too early -.-
			setTimeout(() => {
				hiddenVideo.currentTime = 0;
			}, 500);
			hiddenVideo.addEventListener('seeked', () => {
				const canvas = document.createElement('canvas');
				canvas.width = hiddenVideo.videoWidth;
				canvas.height = hiddenVideo.videoHeight;
				const ctx = canvas.getContext('2d');
				ctx.drawImage(hiddenVideo, 0, 0, canvas.width, canvas.height);
				ctx.canvas.toBlob(blob => {
					resolve(blob);
				});
			});
		});
	});
}

function doModal(data, postcallback) {
	try {
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
		if (modalframe) {
			//if theres a modal frame and user has default theme, style it
			if (localStorage.getItem('theme') === 'default') {
				modalframe.onload = () => {
					const currentTheme = document.head.querySelector('#theme').href;
					modalframe.contentDocument.styleSheets[1].ownerNode.href = currentTheme;
				}
			}
			if (postcallback) {
				checkInterval = setInterval(() => {
					if (modalframe && modalframe.contentDocument.title == 'Success') {
						clearInterval(checkInterval);
						removeModal();
						postcallback();
					}
				}, 100);
			}
		}
	} catch(e) {
		console.error(e)
	}
}

const checkTypes = ['checkbox', 'radio'];
function isCheckBox(element) {
	return checkTypes.includes(element.type)
}

function formToJSON(form) {
	const data = {};
	for (element of form.elements) {
		if (element.name /*&& element.value*/ && (!isCheckBox(element) || element.checked)) {
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

let recaptchaResponse = null;
function recaptchaCallback(response) {
	recaptchaResponse = response;
}

class postFormHandler {

	constructor(form) {
		this.form = form;
		this.enctype = this.form.getAttribute('enctype');
		this.messageBox = form.querySelector('#message');
		this.captchaField = form.querySelector('.captchafield') || form.querySelector('.g-recaptcha') || form.querySelector('.h-captcha');
		this.submit = form.querySelector('input[type="submit"]');
		if (this.submit) {
			this.originalSubmitText = this.submit.value;
		}
		this.minimal = this.form.elements.minimal;
		this.files = [];
		this.fileInput = form.querySelector('input[type="file"]');
		if (this.fileInput) {
			this.fileRequired = this.fileInput.required;
			this.fileLabel = this.fileInput.previousSibling;
			this.fileUploadList = this.fileInput.nextSibling;
			this.multipleFiles = this.fileLabel.parentNode.previousSibling.firstChild.textContent.endsWith('s');
			this.fileLabelText = this.fileLabel.childNodes[0];
			this.fileLabel.addEventListener('dragover', e => this.fileLabelDrag(e));
			this.fileLabel.addEventListener('drop', e => this.fileLabelDrop(e));
			this.fileInput.addEventListener('change', e => this.fileInputChange(e));
			this.fileLabel.addEventListener('auxclick', e => this.fileLabelAuxclick(e));
		}
		this.customFlagInput = this.form.elements.customflag;
		this.selectedFlagImage = document.getElementById('selected-flag');
		if (this.customFlagInput && this.selectedFlagImage) {
			this.customFlagInput.addEventListener('change', () => this.updateFlagField(), false);
			this.updateFlagField();
		}
		this.messageBox && this.messageBox.addEventListener('keydown', e => this.controlEnterSubmit(e));
		form.addEventListener('paste', e => this.paste(e));
		form.addEventListener('submit', e => this.formSubmit(e));
	}

	reset() {
		const savedName = this.form.elements.name && this.form.elements.name.value;
		this.form.reset();
		if (this.form.elements.name) {
			this.form.elements.name.value = savedName;
		}
		if (this.form.elements.postpassword) {
			this.form.elements.postpassword.value = localStorage.getItem('postpassword');
		}
		this.updateFlagField();
		this.updateMessageBox();
		this.files = [];
		this.updateFilesText();
		const captcha = this.form.querySelector('.captcharefresh');
		if (captcha) {
			captcha.dispatchEvent(new Event('click'));
		}
	}

	updateFlagField() {
		if (this.customFlagInput) {
			this.selectedFlagImage.src = this.customFlagInput.options[this.customFlagInput.options.selectedIndex].dataset.src || '';
		}
	}

	controlEnterSubmit(e) {
		if (e.ctrlKey && e.key === 'Enter') {
			this.formSubmit(e);
		}
	}

	formSubmit(e) {
		const xhr = new XMLHttpRequest();
		let postData;
		const captchaResponse = recaptchaResponse;
		if (this.enctype === 'multipart/form-data') {
			this.fileInput && (this.fileInput.disabled = true);
			postData = new FormData(this.form);
			if (captchaResponse) {
				postData.append('captcha', captchaResponse);
			}
			this.fileInput && (this.fileInput.disabled = false);
			if (this.files && this.files.length > 0) {
				//add files to file input element
				for (let i = 0; i < this.files.length; i++) {
					postData.append('file', this.files[i]);
				}
			}
		} else {
			postData = new URLSearchParams([...(new FormData(this.form))]);
			if (captchaResponse) {
				postData.set('captcha', captchaResponse);
			}
		}
		if (this.banned
			|| this.minimal
			|| (postData instanceof URLSearchParams && postData.get('edit') === '1')) {
			return true;
		} else {
			e.preventDefault();
		}
		this.submit.disabled = true;
		this.submit.value = 'Processing...';
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
				if (captchaResponse && grecaptcha) {
					grecaptcha.reset();
				} else if(captchaResponse && hcaptcha) {
					hcaptcha.reset();
				}
				if (xhr.getResponseHeader('x-captcha-enabled') === 'false') {
					//remove captcha if it got disabled after you opened the page
					captchaController.removeCaptcha();
					this.captchaField = null;
				}
				this.submit.disabled = false;
				this.submit.value = this.originalSubmitText;
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
							//
						}
					} else {
						if (json.postId) {
							window.myPostId = json.postId;
						}
						if (json.redirect) {
							const redirectBoard = json.redirect.split('/')[1];
							const redirectPostId = json.redirect.split('#')[1];
							if (redirectBoard && redirectPostId) {
								appendLocalStorageArray('yous', `${redirectBoard}-${redirectPostId}`);
							}
						}
						if (json.message || json.messages || json.error || json.errors) {
							doModal(json);
						} else if (socket && socket.connected) {
							window.location.hash = json.postId
						} else {
							if (!isThread) {
								return window.location = json.redirect;
							}
							setLocalStorage('myPostId', json.postId);
							forceUpdate();
						}
					}
					//dont reset on edit, keep the new values in there. todo: add exceptions/better handling for this situation
					const formAction = this.form.getAttribute('action');
					if (formAction !== '/forms/editpost'
						&& !formAction.endsWith('/settings')) {
						this.reset();
					}
				} else {
					if (xhr.status === 413) {
						//not json, must be nginx response
						doModal({
							'title': 'Payload Too Large',
							'message': 'Your upload was too large',
						});
					} else if (json) {
						if (!this.captchaField && json.message === 'Incorrect captcha answer') {
							captchaController.addMissingCaptcha();
							this.captchaField = true;
						} else if (json.message === 'Captcha expired') {
							const captcha = this.form.querySelector('.captcharefresh');
							if (captcha) {
								captcha.dispatchEvent(new Event('click'));
							}
						}
						doModal(json, () => {
							this.formSubmit(e);
						});
					} else {
//for bans, post form to show TODO: make modal support bans json and send dynamicresponse from it (but what about appeals, w/ captcha, etc?)
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
			this.submit.value = this.originalSubmitText;
		}
		xhr.open(this.form.getAttribute('method'), this.form.getAttribute('action'), true);
		if (!this.minimal) {
			xhr.setRequestHeader('x-using-xhr', true);
		}
		const isLive = localStorage.getItem('live') == 'true' && socket && socket.connected;
		if (isLive) {
			xhr.setRequestHeader('x-using-live', true);
		}
		if (this.enctype !== 'multipart/form-data') {
			xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		}
		xhr.send(postData);
	}

	updateMessageBox() {
		this.messageBox && this.messageBox.dispatchEvent(new Event('input'));
	}

	removeFile(fileElem, name, size) {
		fileElem.remove();
		let fileIndex;
		this.files.find((f, index) => {
			if (f.name === name && f.size === size) {
				fileIndex = index;
			}
		})
		this.files.splice(fileIndex, 1);
		this.updateFilesText();
	}

	async addFile(file) {
		if (this.fileRequired) { //prevent drag+drop issues by removing required
			this.fileInput.removeAttribute('required');
		}
		this.files.push(file);
		console.log('got file', file.name, );
		let fileHash;
		if (window.crypto.subtle) {
			let fileBuffer;
			if (file.arryaBuffer) {
				fileBuffer = await file.arrayBuffer();
			} else {
				//can old browsers just fuck off please?
				const bufferFileReader = new FileReader();
				await new Promise((res, rej) => {
					bufferFileReader.addEventListener('loadend', res);
					bufferFileReader.readAsArrayBuffer(file);
				});
				if (bufferFileReader.result) {
					fileBuffer = bufferFileReader.result;
				}
			}
			const fileDigest = await window.crypto.subtle.digest('SHA-256', fileBuffer);
			fileHash = Array.from(new Uint8Array(fileDigest))
				.map(c => c.toString(16).padStart(2, '0'))
				.join('');
			console.log('file hash', fileHash);
		}
		const item = {
			spoilers: this.fileUploadList.dataset.spoilers === 'true',
			stripFilenames: this.fileUploadList.dataset.stripFilenames === 'true',
			name: file.name,
			hash: fileHash,
		}
		switch (file.type.split('/')[0]) {
			case 'image':
				item.url = URL.createObjectURL(file);
				break;
			case 'audio':
				item.url = '/file/audio.png'
				break;
			case 'video':
				try {
					const thumbnailBlob = await videoThumbnail(file);
					item.url = URL.createObjectURL(thumbnailBlob);
				} catch (err) {
					//couldnt create video thumb for some reason
					item.url = '/file/video.png'
				}
				break;
			default:
				item.url = '/file/attachment.png'
				break;
		}
		const uploadItemHtml = uploaditem({ uploaditem: item });
		this.fileUploadList.insertAdjacentHTML('beforeend', uploadItemHtml);
		const fileElem = this.fileUploadList.lastChild;
		const lastClose = fileElem.querySelector('.close');
		lastClose.addEventListener('click', () => {
			this.removeFile(fileElem, file.name, file.size);
		})
		this.fileUploadList.style.display = 'unset';
	}

	//show number of files on new label
	updateFilesText() {
		if (!this.fileLabelText) {
			return;
		}
		if (this.files && this.files.length === 0) {
			this.fileUploadList.textContent = '';
			this.fileUploadList.style.display = 'none';
			this.fileLabelText.nodeValue = `Select/Drop/Paste file${this.multipleFiles ? 's' : ''}`;
		} else {
			this.fileLabelText.nodeValue = `${this.files.length} file${this.files.length > 1 ? 's' : ''} selected`;
		}
		this.fileInput.value = null;
	}

	//remove all files from this form
	clearFiles() {
		if (!this.fileInput) {
			return;
		}
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

	window.addEventListener('addPost', (e) => {
		if (e.detail.hover) {
			return; //dont need to handle hovered posts for this
		}
		if (window.myPostId == e.detail.postId) {
			window.location.hash = e.detail.postId;
		}
	});

});

window.addEventListener('settingsReady', () => {

	for (let i = 0; i < forms.length; i++) {
		if (forms[i].method === 'post') {
			new postFormHandler(forms[i]);
		}
	}

});

