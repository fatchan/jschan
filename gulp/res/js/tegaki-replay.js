/* globals Tegaki TegakiWrapper */
function showTegakiReplay(e) {
	e.preventDefault(); //prevent nojs download fallback
	TegakiWrapper.init();
	Tegaki.open({
		onCancel: () => {
			TegakiWrapper.remove();
		},
		onDone: () => {
			TegakiWrapper.remove();
		},
		target: TegakiWrapper.element,
		replayMode: true,
		replayURL: e.target.href,
	});
	/* set color palette to same as what the replay should start at (not a recorded event because we 
		set it programmatically when calling tegaki.open for drawing). It looks like the replay uses colors
		from the wrong palette otherwise. */
	Tegaki.setColorPalette(2);
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
