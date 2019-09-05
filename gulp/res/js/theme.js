function changeTheme(e) {
	var theme = e ? this.value : localStorage.getItem('theme');
	if (!theme) {
		theme = 'default';
	}
	localStorage.setItem('theme', theme);
	var custom = document.getElementById('customtheme');
	if (theme === 'default') {
		if (custom) {
            custom.remove();
        }
	} else {
		var path = '/css/themes/'+theme+'.css';
		var css = localStorage.getItem(path);
		if (!custom) {
            custom = document.createElement('style');
            custom.id = 'customtheme';
            document.head.appendChild(custom);
        }
		if (css) {
			custom.innerHTML = css;
		}
		var tempLink = document.createElement('link');
		tempLink.rel = 'stylesheet';
		tempLink.onload = function() {
			css = tempLink.sheet.rules[0].cssText;
			localStorage.setItem(path, css);
			custom.innerHTML = css;
			tempLink.remove();
		}
		tempLink.href = path;
		document.head.appendChild(tempLink);
	}
}

changeTheme();

window.addEventListener('DOMContentLoaded', (event) => {

	var themePicker = document.getElementById('theme-changer');
	var theme = localStorage.getItem('theme');
	if (theme) {
		themePicker.value = theme;
	}
	themePicker.addEventListener('change', changeTheme, false);

});
