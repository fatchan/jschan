function changeTheme(e) {
	var theme = e ? this.value : localStorage.getItem('theme');
	if (!theme) {
		return;
	}
	localStorage.setItem('theme', theme)
	var themeLink = document.getElementById('theme');
	themeLink.href = '/css/themes/'+theme+'.css';
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
