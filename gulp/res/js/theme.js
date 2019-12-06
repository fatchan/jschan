async function changeTheme(e, type) {
	//is this the initial load, or an event from changing theme dropdown
	if (!type) {
		type = this.id === 'theme-changer' ? 'theme' : 'codetheme';
	}
	let theme = e ? this.value : localStorage.getItem(type);
	//first visit, set theme to default
	if (!theme) {
		theme = 'default';
	}
	//add theme setting to localstorage
	setLocalStorage(type, theme);
	//check for theme style tag
	let tempLink = document.getElementById(`custom${type}`);
	let defaultLink = document.getElementById(type);
	if (theme === 'default') {
		defaultLink.rel = 'stylesheet';
		await new Promise(resolve => { setTimeout(resolve, 100) });//ew
		if (tempLink) {
			//remove theme style tag if we switching to default
			tempLink.remove();
		}
	} else {
		//path of the theme css
		const path = `/css/${type}s/${theme}.css`;
		//get the raw css from localstorage
		let css = localStorage.getItem(path);
		if (!tempLink) {
			//create the style tag if it doesnt exist
			tempLink = document.createElement('style');
			document.head.appendChild(tempLink);
		}
		if (css) {
			//if we have the css in localstorage, set it (prevents FOUC)
			tempLink.innerHTML = css;
		}
		defaultLink.rel = 'alternate stylesheet';
		//then createa new link rel=stylesheet, and load the css 
		const themeLink = document.createElement('link');
		themeLink.rel = 'stylesheet';
		themeLink.id = `custom${type}`;
		themeLink.onload = function() {
			css = '';
			const rulesName = themeLink.sheet.rules != null ? 'rules' : 'cssRules'; //browser compatibility shit
			for(let i = 0; i < themeLink.sheet[rulesName].length; i++) {
				css += themeLink.sheet[rulesName][i].cssText;
			}
			//update our localstorage with latest version
			setLocalStorage(path, css);
			tempLink.innerHTML = css;
			//immediately remove it since we dont need it
			tempLink.remove();
		}
		themeLink.href = path;
		document.head.appendChild(themeLink);
	}
}

changeTheme(null, 'theme');
changeTheme(null, 'codetheme');

window.addEventListener('settingsReady', function(event) {

	//for main theme
	const themePicker = document.getElementById('theme-changer');
	themePicker.value = localStorage.getItem('theme')

	//for code theme
	const codeThemePicker = document.getElementById('code-theme-changer');
	codeThemePicker.value = localStorage.getItem('codetheme')

	themePicker.addEventListener('change', changeTheme, false);
	codeThemePicker.addEventListener('change', changeTheme, false);

});
