window.addEventListener('DOMContentLoaded', (event) => {

	const messageBox = document.getElementById('message');

	if (messageBox) {
		const messageBoxLabel = messageBox.previousSibling;
		const maxLength = messageBox.getAttribute('maxlength');
		let currentLength = messageBox.value.length;
		const counter = document.createElement('small');
		messageBoxLabel.appendChild(counter);

		const updateCounter = () => {
			counter.innerText = `(${currentLength}/${maxLength})`;
			if (currentLength >= maxLength) {
				counter.style.color = 'red';
			} else {
				counter.removeAttribute('style');
			}
		};

		const updateLength = function(e) {
			currentLength = messageBox.value.length;
			updateCounter();
		};

		updateCounter();

		messageBox.addEventListener('input', updateLength);

	}

});
