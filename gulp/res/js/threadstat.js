/* globals __n isThread */
window.addEventListener('DOMContentLoaded', () => {

	const statsElem = document.getElementById('threadstats');
	const idElems = Array.from(document.getElementsByClassName('user-id'));
	const idMap = new Map();
	const isHighlightedSet = new Set();

	const incrementMap = (id) => {
		idMap.set(id, idMap.get(id)+1 || 1);
	};

	const updateCounts = (updateId) => {
		for (let i = 0; i < idElems.length; i++) {
			const idString = idElems[i].innerText;
			if (updateId && updateId !== idString) { continue; }
			const count = idMap.get(idString);
			idElems[i].setAttribute('data-count', ` (${count})`);
			idElems[i].setAttribute('title', __n('Double click to highlight (%s)', count));
			idElems[i].setAttribute('title-mobile', __n('Double tap to highlight (%s)', count));
		}
	};

	const toggleHighlightPosts = (e) => {
		const id = e.target.innerText;
		const idPosts = document.querySelectorAll(`.post-container[data-user-id="${id}"]`);
		const isHighlighted = isHighlightedSet.has(id);
		isHighlightedSet[isHighlighted ? 'delete' : 'add'](id);
		for (let i = 0; i < idPosts.length; i++) {
			idPosts[i].classList[isHighlighted ? 'remove' : 'add']('highlighted');
		}
	};

	//map count of starting ids
	for (let i = 0; i < idElems.length; i++) {
		idElems[i].addEventListener('dblclick', toggleHighlightPosts);
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
			statsElem.children[0].innerText = __n('%s replies', postTotal);
			statsElem.children[1].innerText = __n('%s files', filesTotal);
			if (e.detail.json.userId) {
				const userId = e.detail.post.querySelector('.user-id');
				idElems.push(userId);
				userId.addEventListener('dblclick', toggleHighlightPosts);
				incrementMap(e.detail.json.userId);
				updateCounts(e.detail.json.userId);
				if (isHighlightedSet.has(e.detail.json.userId)) {
					e.detail.post.classList.add('highlighted');
				}
				if (!statsElem.children[2]) {
					//UIDs enabled after thread generated
					const spacer = document.createTextNode(' |  ');
					const uidSpan = document.createElement('span');
					statsElem.appendChild(spacer);
					statsElem.appendChild(uidSpan);
				}
				statsElem.children[2].innerText = __n('%s UIDs', idMap.size);
			}
		});
	}

});
