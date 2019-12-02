window.addEventListener('DOMContentLoaded', (event) => {

	const statsElem = document.getElementById('threadstats');
	if (statsElem) {
		const uidElems = document.getElementsByClassName('user-id');
		const uidSet = new Set();
		for(let i = 0; i < uidElems.length; i++) {
			uidSet.add(uidElems[i].innerText);
		}
		window.addEventListener('addPost', function(e) {
			if (e.detail.hover) {
				return; //dont need to handle hovered posts for this
			}
			const newFiles = e.detail.json.files.length;
console.log(newFiles)
			if (e.detail.json.userId) {
				uidSet.add(e.detail.json.userId);
			}
			const numPosts = +statsElem.children[0].innerText.match(/^(\d+)/g);
			const numFiles = +statsElem.children[1].innerText.match(/^(\d+)/g);
			const filesTotal = numFiles + newFiles;
			const postTotal = numPosts + 1;
			statsElem.children[0].innerText = `${postTotal} repl${postTotal === 1 ? 'y' : 'ies'}`;
			statsElem.children[1].innerText = `${filesTotal} file${filesTotal === 1 ? '' : 's'}`;
			if (e.detail.json.userId) {
				statsElem.children[2].innerText = `${uidSet.size} UID${uidSet.size === 1 ? '' : 's'}`;
			}
		});
	}

});
