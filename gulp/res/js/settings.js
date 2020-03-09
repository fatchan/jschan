window.addEventListener('DOMContentLoaded', (event) => {

	let settingsModal;
	let settingsBg;

	const hideSettings = () => {
		settingsModal.style.display = 'none';
		settingsBg.style.display = 'none';
	}

	const openSettings = (data) => {
		settingsModal.style.display = 'unset';
		settingsBg.style.display = 'unset';
	}

	const modalHtml = modal({
		modal: {
			title: 'Settings',
			settings: {
				themes,
				codeThemes,
			},
			hidden: true,
		}
	});

	const inserted = document.body.insertAdjacentHTML('afterbegin', modalHtml);
	settingsBg = document.getElementsByClassName('modal-bg')[0];
	settingsModal = document.getElementsByClassName('modal')[0];

	settingsBg.onclick = hideSettings;
	settingsModal.getElementsByClassName('close')[0].onclick = hideSettings;

	const settings = document.getElementById('settings');
	if (settings) { //can be false if we are in minimal view
		settings.onclick = openSettings;
	}

	window.dispatchEvent(new CustomEvent('settingsReady'));

});
