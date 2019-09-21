function changeTheme(e) {
	//is this the initial load, or an event from changing theme dropdown
	let theme = e ? this.value : localStorage.getItem('theme');
	//first visit, set theme to default
	if (!theme) {
		theme = 'default';
	}
	//add theme setting to localstorage
	localStorage.setItem('theme', theme);
	//check for theme style tag
	let tempLink = document.getElementById('customtheme');
	if (theme === 'default') {
		if (tempLink) {
			//remove theme style tag if we switching to default
			tempLink.remove();
		}
	} else {
		//path of the theme css
		const path = '/css/themes/'+theme+'.css';
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
		//then createa new link rel=stylesheet, and load the css 
		const themeLink = document.createElement('link');
		themeLink.rel = 'stylesheet';
		themeLink.id = 'customtheme';
		themeLink.onload = function() {
			css = '';
			const rulesName = themeLink.sheet.rules != null ? 'rules' : 'cssRules'; //browser compatibility shit
            for(let i = 0; i < themeLink.sheet[rulesName].length; i++) {
                css += themeLink.sheet[rulesName][i].cssText;
            }
			//update our localstorage with latest version
			localStorage.setItem(path, css);
			tempLink.innerHTML = css;
			//immediately remove it since we dont need it
			tempLink.remove();
		}
		themeLink.href = path;
		document.head.appendChild(themeLink);
	}
}

changeTheme();

window.addEventListener('DOMContentLoaded', (event) => {

	const themePicker = document.getElementById('theme-changer');
	themePicker.value = localStorage.getItem('theme')

	themePicker.addEventListener('change', changeTheme, false);

});
