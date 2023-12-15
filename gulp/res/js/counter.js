window.addEventListener('DOMContentLoaded', () => {

	const messageBox = document.getElementById('message');
	const parentForm = messageBox && messageBox.form;

	if (messageBox) {
		const messageBoxLabel = messageBox.previousSibling;
		const maxLength = messageBox.getAttribute('maxlength');
		const minLength = messageBox.getAttribute('minlength');
		let currentLength = messageBox.value.length;
		const counter = document.createElement('small');
		messageBoxLabel.appendChild(counter);

		const updateCounter = () => {
			counter.innerText = `(${currentLength}/${maxLength})`;
			if (currentLength >= maxLength || currentLength < minLength) {
				counter.style.color = 'red';
			} else {
				counter.removeAttribute('style');
			}
		};

		const updateLength = function() {
			if (messageBox.value.length > maxLength) {
				messageBox.value = messageBox.value.substring(0,maxLength);
			}
			currentLength = messageBox.value.length;
			updateCounter();
			parentForm && parentForm.dispatchEvent(new CustomEvent('messageBoxChange'));
		};

		updateCounter();

		messageBox.addEventListener('input', updateLength);

	}

});
