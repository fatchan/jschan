function changeTheme(e) {
	var theme = e ? this.value : localStorage.getItem('theme');
	if (!theme) {
		theme = 'default';
	}
	localStorage.setItem('theme', theme);
	var themeLink = document.getElementById('theme');
	//if somebody makes a theme file named "default", it wont work. so just dont.
	if (theme === 'default') {
		var defaultTheme = themeLink.dataset.theme;
		var defaultHref = '/css/themes/'+defaultTheme+'.css';
		if (themeLink.href !== defaultHref) {
			themeLink.href = '/css/themes/'+defaultTheme+'.css';
		}
	} else {
		themeLink.href = '/css/themes/'+theme+'.css';
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
