function getTegakiReplayBTN(url) {
	let a = document.createElement('a');
	a.text = '[View replay]';
	a.classList.add('dummy-link');
	a.download = url;
	a.href = url;

	a.addEventListener('click', (me) => {
		me.preventDefault();
		window.dispatchEvent(
			(new CustomEvent('showTegakiReplay',{detail:url}))
		);
	});

	return a;
}

/**
 * 
 * @param {HTMLElement[]} fileInfos 
 * @param {string} tegakiName 
 * @returns {HTMLAnchorElement|undefined}
 */
function getReplayElement(fileInfos,tegakiName) {
	let replay = undefined;
	fileInfos.forEach((e) => {
		e.querySelectorAll('a').forEach((a) => {
			let tegaki = tegakiName.replace('tegaki.png', 'replay.tgkr');
			if (tegaki === a.download) {
				replay = a;
				return;
			}
		});
		if (replay) { 
			return;
		} 
	});

	return replay;
}

function tryAddTegakiReplays(post) {
	let fileInfos = post.querySelectorAll('.post-file-info');

	fileInfos.forEach((fi) => {
		let a = fi.querySelector('a');
		let isTegakiReplay = a.download.endsWith('.tgkr');
		let isTegaki = a.download.endsWith('-tegaki.png');
		
		if (isTegaki) {
			let replay = getReplayElement(fileInfos, a.download);

			if (replay) {
				fi.appendChild(getTegakiReplayBTN(`${replay.href}`));
				replay.parentElement.parentElement.parentElement.remove();
			}

		} else if (isTegakiReplay) {
			fi.appendChild(getTegakiReplayBTN(`${a.href}`));
		}
	});
}

window.addEventListener('DOMContentLoaded', () => {
	let postContainers = document.querySelectorAll('.post-container');
	
	postContainers.forEach((post) => {
		tryAddTegakiReplays(post);
	});
});

window.addEventListener('addPost', function (e) {
	tryAddTegakiReplays(e.detail.post);
});
