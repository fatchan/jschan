

const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';
const generatePassword = () => {
	if (window.crypto) {
		const buf = new Uint8Array(20); //8 keeps charcodes within range
		window.crypto.getRandomValues(buf);
		return btoa(String.fromCharCode.apply(null, buf));
	} else {
		return new Array(20)
			.fill(null)
			.map(x => charset[Math.floor(Math.random()*charset.length)])
			.join('');
	}
}
setDefaultLocalStorage('postpassword', generatePassword());

class syncedField {
	constructor(selector, key, persistent) {
		this.fields = document.querySelectorAll(selector);
		this.key = key;
		this.persistent = persistent;
		for (let field of this.fields) {
			field.value = localStorage.getItem(this.key);
			field.addEventListener('input', (e) => { this.update(e) }, false);
		}
	}
	update(e) {
		if (this.persistent) {
			setLocalStorage(this.key, e.target.value);
		}
		for (let field of this.fields) {
			field.value = e.target.value;
		}
	}
}

window.addEventListener('settingsReady', () => {

	new syncedField('input[name="postpassword"]', 'postpassword', true);

});
