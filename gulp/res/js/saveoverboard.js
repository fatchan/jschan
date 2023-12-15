/* globals setLocalStorage */
const overboardLink = document.getElementById('overboardlink');
if (overboardLink) {
	const overboardLinkPathname = new URL(overboardLink.href).pathname;
	const updateOverboardLink = () => {
		const overboardSettings = JSON.parse(localStorage.getItem('overboardsettings'));
		if (overboardSettings.add.length > 0 || overboardSettings.rem.length > 0 || !overboardSettings.include_default) {
			overboardLink.setAttribute('href', `${overboardLinkPathname}?${new URLSearchParams(overboardSettings)}`);
		}
	};
	updateOverboardLink();
	const overboardForm = document.getElementById('overboardform');
	if (overboardForm) {
		const saveOverboardSettings = () => {
			const newOverboardSettings = {
				add: overboardForm.elements.add.value,
				rem: overboardForm.elements.rem.value,
				include_default: overboardForm.elements.include_default.checked,
			};
			if (newOverboardSettings.add.length === 0 && !newOverboardSettings.include_default) {
				newOverboardSettings.include_default = true; //nice
			}
			setLocalStorage('overboardsettings', JSON.stringify(newOverboardSettings));
		};
		overboardForm.addEventListener('submit', saveOverboardSettings, false);
	}
}
