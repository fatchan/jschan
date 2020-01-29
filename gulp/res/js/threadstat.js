window.addEventListener('DOMContentLoaded', (event) => {

	const statsElem = document.getElementById('threadstats');
	const idElems = [];
	const idMap = new Map();

	const incrementMap = (id) => {
		idMap.set(id, idMap.get(id)+1 || 1);
	}

	const updateCounts = () => {
		for(let i = 0; i < idElems.length; i++) {
			idElems[i].setAttribute('data-count', ` (${idMap.get(idElems[i].innerText)})`);
		}
	}

	const toggleHighlightPosts = (e) => {
		const id = e.target.innerText;
		const idPosts = document.querySelectorAll(`.post-container[data-user-id="${id}"]`);
		for(let i = 0; i < idPosts.length; i++) {
			idPosts[i].classList.toggle('highlighted');
		}
	}

	//fetch starting ids
	const startElems = document.getElementsByClassName('user-id');
	for(let i = 0; i < startElems.length; i++) {
		idElems.push(startElems[i]);
		startElems[i].addEventListener('dblclick', toggleHighlightPosts);
	}
	//set counts
	for(let i = 0; i < idElems.length; i++) {
		incrementMap(idElems[i].innerText);
	}

	if (isThread) {
		//set the attr for css hover count
		updateCounts();

		window.addEventListener('addPost', function(e) {
			if (e.detail.hover) {
				return; //dont need to handle hovered posts for this
			}
			const newFiles = e.detail.json.files.length;
			const numPosts = +statsElem.children[0].innerText.match(/^(\d+)/g);
			const numFiles = +statsElem.children[1].innerText.match(/^(\d+)/g);
			const filesTotal = numFiles + newFiles;
			const postTotal = numPosts + 1;
			statsElem.children[0].innerText = `${postTotal} repl${postTotal === 1 ? 'y' : 'ies'}`;
			statsElem.children[1].innerText = `${filesTotal} file${filesTotal === 1 ? '' : 's'}`;
			if (e.detail.json.userId) {
				const userId = e.detail.post.querySelector('.user-id');
				idElems.push(userId);
				userId.addEventListener('dblclick', toggleHighlightPosts);
				incrementMap(e.detail.json.userId);
				updateCounts();
				if (!statsElem.children[2]) {
					//UIDs enabled after thread generated
					const spacer = document.createTextNode(' |  ');
					const uidSpan = document.createElement('span');
					statsElem.appendChild(spacer);
					statsElem.appendChild(uidSpan);
				}
				statsElem.children[2].innerText = `${idMap.size} UID${idMap.size === 1 ? '' : 's'}`;
			}
		});
	}

});
