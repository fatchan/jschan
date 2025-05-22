/* globals Tegaki Dragable Minimisable TegakiStrings tegakiwindow */
/* eslint-disable no-unused-vars */
class TegakiWrapper {
	static init () {
		if (Tegaki.replayViewer && Tegaki.replayViewer.playing) {
			//do this undocuemented shit to prevent js hanging and crashing the browser
			Tegaki.replayViewer.destroy();
		}
		if (this.element) { return; }
		const footer = document.querySelector('.footer');
		const tegakiwindowHtml = tegakiwindow({ minimised: false });
		footer.insertAdjacentHTML('afterend', tegakiwindowHtml);
		this.element = document.getElementById('tegakiwindow');
		const updateTegakiOffsets = () => {
			Tegaki.canvas && (Tegaki.updatePosOffset(), Tegaki.updateCursorStatus());
		};
		new Dragable('#tegakiwindow-dragHandle', '#tegakiwindow', updateTegakiOffsets);
		new Minimisable('#tegakiwindow', [
			{ selector: '#close', cb: () => confirm(TegakiStrings.confirmCancel) && this.remove(), trueText: '[×]' },
			{ selector: '#minimise', cb: 'toggleMinimise', textVar: 'minimised', trueText: '[+]', falseText: '[-]' },
			{ selector: '#maximise', cb: 'toggleMaximise', trueText: '[⤢]' }
		], null, updateTegakiOffsets).init();
	}
	static remove () {
		try {
			Tegaki.destroy();
		} catch (e) { console.warn(e); }
		this.element && (this.element = this.element.remove());
	}
}
