function changeTheme(e) {
	//is this the initial load, or an event from changing theme dropdown
	var theme = e ? this.value : localStorage.getItem('theme');
	//first visit, set theme to default
	if (!theme) {
		theme = 'default';
	}
	//add theme setting to localstorage
	localStorage.setItem('theme', theme);
	//check for theme style tag
	var custom = document.getElementById('customtheme');
	if (theme === 'default') {
		if (custom) {
			//remove theme style tag if we switching to default
			custom.remove();
		}
	} else {
		//path of the theme css
		var path = '/css/themes/'+theme+'.css';
		//get the raw css from localstorage
		var css = localStorage.getItem(path);
		if (!custom) {
			//create the style tag if it doesnt exist
			custom = document.createElement('style');
			custom.id = 'customtheme';
			document.head.appendChild(custom);
		}
		if (css) {
			//if we have the css in localstorage, set it (prevents FOUC)
			custom.innerHTML = css;
		}
		//then createa new link rel=stylesheet, and load the css 
		var tempLink = document.createElement('link');
		tempLink.rel = 'stylesheet';
		tempLink.onload = function() {
			css = '';
            for(var i = 0; i < tempLink.sheet.rules.length; i++) {
                css += tempLink.sheet.rules[i].cssText;
            }
			//update our localstorage with latest version
			localStorage.setItem(path, css);
			custom.innerHTML = css;
			//immediately remove it since we dont need it
			custom.remove();
		}
		tempLink.href = path;
		document.head.appendChild(tempLink);
	}
}

changeTheme();

window.addEventListener('DOMContentLoaded', (event) => {

	var themePicker = document.getElementById('theme-changer');
	themePicker.value = localStorage.getItem('theme')

	themePicker.addEventListener('change', changeTheme, false);

});
