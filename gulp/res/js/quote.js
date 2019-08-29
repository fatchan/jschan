//this is so normies dont complain about multiple tabs until i make something nicer
window.addEventListener('DOMContentLoaded', (event) => {

	var links = document.getElementsByClassName('post-quoters');

	var quote = function(e) {
		const quoteNum = this.textContent.replace('[Reply]', '').split(' ')[0].trim();
		const messageBox = document.getElementById('message')
		messageBox.value += `>>${quoteNum}\n`;
		messageBox.scrollTop = messageBox.scrollHeight;
	};

	for (var i = 0; i < links.length; i++) {
		links[i].addEventListener('click', quote, false);
	}

});
