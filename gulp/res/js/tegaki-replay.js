/* globals Tegaki */
function showTegakiReplay(e){
	e.preventDefault(); //prevent nojs download fallback
	Tegaki.open({
		replayMode: true,
		replayURL: e.target.href,
	});
}

function addReplayListeners(elem) {
	const replayLinks = Array.from(elem.getElementsByClassName('replay-tegaki'));
	replayLinks.forEach(replayLink => {
		replayLink.addEventListener('click', showTegakiReplay, false);
	});	
}

window.addEventListener('DOMContentLoaded', () => {
	addReplayListeners(document);
});

window.addEventListener('addPost', e => {
	if (!e.detail.hover) {
		addReplayListeners(e.detail.post);
	}
});
