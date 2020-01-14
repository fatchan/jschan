setDefaultLocalStorage('customcss', '');
let customCSSString = localStorage.getItem('customcss');

window.addEventListener('settingsReady', function(event) {

	//for main theme
	const themePicker = document.getElementById('theme-setting');
	themePicker.value = localStorage.getItem('theme');
	themePicker.addEventListener('change', () => {
		setLocalStorage('theme', themePicker.value);
		changeTheme('theme');
	}, false);

	//for code theme
	const codeThemePicker = document.getElementById('codetheme-setting');
	codeThemePicker.value = localStorage.getItem('codetheme');
	codeThemePicker.addEventListener('change', () => {
		setLocalStorage('codetheme', codeThemePicker.value);
		changeTheme('codetheme');
	}, false);

	//custom CSS for users
    const customCSSSetting = document.getElementById('customcss-setting');
    const editCustomCSS = (change) => {
        customCSSString = customCSSSetting.value;
        console.log('editing custom CSS', customCSSString.length);
        setLocalStorage('customcss', customCSSString); //what if this gets too long?
		changeTheme('customcss');
    }
    customCSSSetting.value = customCSSString;
    customCSSSetting.addEventListener('input', editCustomCSS, false);

});

function changeTheme(type) {
	switch(type) {
		case 'theme':
		case 'codetheme':
			const theme = localStorage.getItem(type) || 'default';
			let tempLink = document.getElementById(`custom${type}`);
			let defaultLink = document.getElementById(type);
			if (theme === 'default' || theme === defaultLink.dataset.theme) {
				defaultLink.rel = 'stylesheet';
				setTimeout(() => {
					tempLink && tempLink.remove();
				}, 100);
			} else {
				//use path and try to fetch from localstorage
				const path = `/css/${type}s/${theme}.css`;
				let css = localStorage.getItem(path);
				if (!tempLink) {
					tempLink = document.createElement('style');
					document.head.appendChild(tempLink);
				}
				if (css) {
					tempLink.innerHTML = css; //set as inline style temporarily
				}
				defaultLink.rel = 'alternate stylesheet'; //disable default theme
				const themeLink = document.createElement('link');
				themeLink.rel = 'stylesheet';
				themeLink.id = `custom${type}`;
				themeLink.onload = function() {
					css = '';
					const rulesName = themeLink.sheet.rules != null ? 'rules' : 'cssRules';
					for(let i = 0; i < themeLink.sheet[rulesName].length; i++) {
						css += themeLink.sheet[rulesName][i].cssText; //add all the rules to the css
					}
					//update localstorage with latest version
					setLocalStorage(path, css);
					tempLink.innerHTML = css;
					//remove temp inline style since we dont need it anymore
					tempLink.remove();
				}
				themeLink.href = path;
				document.head.appendChild(themeLink);
			}
			break;
		case 'customcss':
			let customCSSLink = document.getElementById(type);
			if (!customCSSLink) {
				customCSSLink = document.createElement('style');
				customCSSLink.rel = 'stylesheet';
				customCSSLink.id = 'customcss';
		        document.head.appendChild(customCSSLink);
			}
			customCSSLink.innerHTML = customCSSString;
			break;
	}
}
changeTheme('theme');
changeTheme('codetheme');
changeTheme('customcss');
