/* globals setLocalStorage */
window.addEventListener('settingsReady', () => {

	const settingNames = ['volume','loop','imageloadingbars','live','scroll','localtime','relative','24hour','notifications','hiddenimages', 'threadwatcher'
		,'notification-yous-only','yous-setting','filters1','name','theme','codetheme','customcss','disableboardcss','hiderecursive', 'watchlist'
		,'heightlimit','crispimages','hidethumbnails','noncolorids','alwaysshowspoilers','hidedeletedpostcontent','hidepoststubs','smoothscrolling'
		,'tegakiheight-setting','tegakiwidth-setting', 'hoverexpandsmedia'];

	const importExportText = document.getElementById('import-export-setting');

	const exportSettingsButton = document.getElementById('export-setting');
	const exportSettings = () => {
		const settingsData = settingNames.reduce((acc, val) => {
			acc[val] = localStorage.getItem(val);
			return acc;
		}, {});
		importExportText.value = JSON.stringify(settingsData);
	};
	exportSettingsButton.addEventListener('click', exportSettings, false);

	const importSettingsButton = document.getElementById('import-setting');
	const importSettings = () => {
		if (importExportText.value.length > 0) {
			try {
				const importedSettings = JSON.parse(importExportText.value);
				Object.entries(importedSettings).forEach(entry => {
					setLocalStorage(entry[0], entry[1]);
				});
				//should we have an update listener one day to import without refresh?
				location.reload();
			} catch (e) {
				//bad data
				console.error(e);
			}
		}
	};
	importSettingsButton.addEventListener('click', importSettings, false);

});
