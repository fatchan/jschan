/* globals setLocalStorage setDefaultLocalStorage settings */
const renderCSSLink = document.createElement('style');
renderCSSLink.type = 'text/css';
renderCSSLink.id = 'rendercss';
document.head.appendChild(renderCSSLink);
const renderSheet = renderCSSLink.sheet;
const rulesKey = renderSheet.rules ? 'rules' : 'cssRules';

class CssToggle {
	constructor (settingId, localStorageKey, localStorageDefault, settingCss) {
		this.localStorageKey = localStorageKey;
		this.localStorageDefault = localStorageDefault;
		setDefaultLocalStorage(this.localStorageKey, this.localStorageDefault);
		this.settingBoolean = localStorage.getItem(this.localStorageKey) == 'true';
		this.settingCss = settingCss;
		window.addEventListener('settingsReady', () => {
			//on event fire, set boolean to correct checked stats
			this.setting = document.getElementById(settingId);
			this.setting.checked = this.settingBoolean;
			this.setting.addEventListener('change', () => {
				this.toggle();
			}, false);
		});
		this.apply();
	}
	toggle () {
		this.settingBoolean = !this.settingBoolean;
		console.log('toggling', this.localStorageKey, this.settingBoolean);
		this.apply();
		setLocalStorage(this.localStorageKey, this.settingBoolean);
	}
	apply () {
		if (this.settingBoolean) {
			renderSheet.insertRule(this.settingCss);
		} else {
			for (let i = 0; i < renderSheet[rulesKey].length; i++) {
				if (renderSheet[rulesKey][i].selectorText == this.settingCss.split(' {')[0]) {
					renderSheet.deleteRule(i);
				}
			}
		}
	}
}

//define the css
const hidePostStubsCss = '.post-container.hidden, .catalog-tile.hidden { display: none;margin-top: -1.5em;height: 0; }';
const hideDeletedPostContentCss = '.post-container.marked[data-mark="Deleted"] .post-data { display: none; }';
const hideThumbnailsCss = '.file-thumb, .catalog-thumb { visibility: hidden !important; }';
const hideRecursiveCss = '.op.hidden ~ .anchor, .op.hidden ~ .post-container { display: none; }';
const heightUnlimitCss = 'img, video { max-height: unset; }';
const crispCss = 'img { image-rendering: crisp-edges; }';
const nonColorIdsCss = '.user-id { background: transparent none repeat scroll 0% 0% !important; border-color: transparent; text-shadow: none; color: var(--font-color); }';
const alwaysShowSpoilersCss = '.spoiler { color: var(--font-color) !important; background: transparent none repeat scroll 0% 0%; outline: 1px solid black; cursor: auto; }';
const smoothScrollingCss = 'html { scroll-behavior: smooth; }';
const threadWatcherCss = '#threadwatcher { display: flex; }';

//make classes with css
new CssToggle('hiderecursive-setting', 'hiderecursive', settings.hideRecursive, hideRecursiveCss);
new CssToggle('heightlimit-setting', 'heightlimit', settings.heightUnlimit, heightUnlimitCss);
new CssToggle('crispimages-setting', 'crispimages', settings.crispImages, crispCss);
new CssToggle('hidethumbnails-setting', 'hidethumbnails', settings.hideThumbnails, hideThumbnailsCss);
new CssToggle('noncolorids-setting', 'noncolorids', settings.nonColorIds, nonColorIdsCss);
new CssToggle('alwaysshowspoilers-setting', 'alwaysshowspoilers', settings.alwaysShowSpoilers, alwaysShowSpoilersCss);
new CssToggle('hidepoststubs-setting', 'hidepoststubs', settings.hidePostStubs, hidePostStubsCss);
new CssToggle('hidedeletedpostcontent-setting', 'hidedeletedpostcontent', settings.hideDeletedPostContent, hideDeletedPostContentCss);
new CssToggle('smoothscrolling-setting', 'smoothscrolling', settings.smoothScrolling, smoothScrollingCss);
new CssToggle('threadwatcher-setting', 'threadwatcher', settings.threadWatcher, threadWatcherCss);
