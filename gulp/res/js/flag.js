window.addEventListener('DOMContentLoaded', function(e) {

	const customFlagInput = document.getElementById('customflag');
	const selectedFlagImage = document.getElementById('selected-flag');
	if (customFlagInput && selectedFlagImage) {
		const updateFlag = () => {
			selectedFlagImage.src = customFlagInput.options[customFlagInput.options.selectedIndex].dataset.src || '';
		};
		customFlagInput.addEventListener('change', updateFlag, false);
		updateFlag();
	}

});
