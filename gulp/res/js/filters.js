/* globals __ setLocalStorage pugfilters isCatalog captchaController threadWatcher */
const getFiltersFromLocalStorage = () => {
	const savedFilters = JSON.parse(localStorage.getItem('filters1'));
	return savedFilters.reduce((acc, filter) => {
		const regexFilter = filter.type.endsWith('r');
		if (regexFilter) {
			acc[filter.type].push(new RegExp(filter.val, 'i')); //todo: serialize flags? probs not necessary
		} else {
			acc[filter.type].add(filter.val);
		}
		return acc;
	}, {
		single: new Set(),
		fid: new Set(),
		fname: new Set(),
		ftrip: new Set(),
		fsub: new Set(),
		fmsg: new Set(),
		fflag: new Set(),
		fnamer: [],
		ftripr: [],
		fsubr: [],
		fmsgr: [],
		fflagr: [],
	});
};

let { single, fid, fname, ftrip, fsub, fmsg, fflag, fnamer, ftripr, fsubr, fmsgr, fflagr } = getFiltersFromLocalStorage();

let filtersTable;
const updateFiltersTable = () => {
	[...filtersTable.children].slice(3).forEach(row => row.remove());
	filtersTable.insertAdjacentHTML('beforeend', pugfilters({filterArr: JSON.parse(localStorage.getItem('filters1'))}));
	const closeButtons = filtersTable.querySelectorAll('.close');
	for (let elem of closeButtons) {
		let { type: closeType, data: closeData } = elem.dataset;
		if (closeType.endsWith('r')) {
			closeData = new RegExp(closeData, 'i');
		}
		elem.addEventListener('click', () => { toggleFilter(closeType, closeData); });
	}
};

const updateSavedFilters = () => {
	setLocalStorage('filters1', JSON.stringify([
		...([...single].map(x => ({type:'single', val:x}))),
		...([...fid].map(x => ({type:'fid', val:x}))),
		...([...ftrip].map(x => ({type:'ftrip', val:x}))),
		...([...fname].map(x => ({type:'fname', val:x}))),
		...([...fsub].map(x => ({type:'fsub', val:x}))),
		...([...fmsg].map(x => ({type:'fmsg', val:x}))),
		...([...fflag].map(x => ({type:'fflag', val:x}))),
		...fnamer.map(x => ({type:'fnamer', val:x.source.toString()})),
		...ftripr.map(x => ({type:'ftripr', val:x.source.toString()})),
		...fsubr.map(x => ({type:'fsubr', val:x.source.toString()})),
		...fmsgr.map(x => ({type:'fmsgr', val:x.source.toString()})),
		...fflagr.map(x => ({type:'fflagr', val:x.source.toString()})),
	]));
	updateFiltersTable();
};

const anyFilterMatches = (filteringPost) => {
	const { board, postId, userId, name, subject, tripcode, country } = filteringPost.dataset;
	const postMessage = filteringPost.querySelector('.post-message');
	const message = postMessage ? postMessage.textContent : null;
	const flag = country ? country.code : null;
	return single.has(`${board}-${postId}`)
		|| fid.has(userId)
		|| fname.has(name)
		|| ftrip.has(tripcode)
		|| fsub.has(subject)
		|| fmsg.has(message)
		|| fflag.has(flag)
		|| fnamer.some(r => r.test(name))
		|| ftripr.some(r => r.test(tripcode))
		|| fsubr.some(r => r.test(subject))
		|| fmsgr.some(r => r.test(message))
		|| fflagr.some(r => r.test(flag));
};

const togglePostsHidden = (posts, state, single) => {
	for (let elem of posts) {
		const showing = (!state && (!anyFilterMatches(elem) || single));
		if (showing) { //possible fix for multiple filters & unhiding conflicts
			elem.classList['remove']('hidden');
		} else {
			elem.classList['add']('hidden');
		}
		elem.querySelector('.postmenu').children[0].textContent = (showing ? __('Hide') : __('Show'));
	}
};

//I wish this wasn't necessary, but css selectors dont support regex :(
const getPostsByRegex = (attribute, regex) => {
	const matches = [];
	for (let elem of document.querySelectorAll(`[${attribute}]`)) {
		const value = elem.getAttribute(attribute).toString();
		if (regex.test(value) === true) {
			matches.push(elem);
		}
	}
	return matches;
};

const getPostsByMessage = (data, regex=false) => {
	//you asked for this
	const postMessages = [...document.querySelectorAll(`.${isCatalog ? 'catalog-tile': 'post-container' } .post-message`)];
	const matchingMessages = postMessages.filter(m => (regex ? data.test(m.textContent) : m.textContent.includes(data)));
	return matchingMessages.map(m => m.closest(`.${isCatalog ? 'catalog-tile': 'post-container' }`));
};

const getPostsByFilter = (type, data) => {
	let posts = [];
	switch (type) {
		case 'single': {
			const [dataBoard, dataPostId] = data.split('-');
			const singlePost = document.querySelector(`[data-board="${dataBoard}"][data-post-id="${dataPostId}"]`);
			posts = singlePost ? [singlePost] : [];
			break;
		}
		case 'fid':
			posts = document.querySelectorAll(`[data-user-id="${data}"]`);
			break;
		case 'fname':
			posts = document.querySelectorAll(`[data-name="${CSS.escape(data)}"]`);
			break;
		case 'fnamer':
			posts = getPostsByRegex('data-name', data);
			break;
		case 'ftrip':
			posts = document.querySelectorAll(`[data-tripcode="${CSS.escape(data)}"]`);
			break;
		case 'ftripr':
			posts = getPostsByRegex('data-tripcode', data);
			break;
		case 'fsub':
			posts = document.querySelectorAll(`[data-subject="${CSS.escape(data)}"]`);
			break;
		case 'fsubr':
			posts = getPostsByRegex('data-subject', data);
			break;
		case 'fmsg':
			posts = getPostsByMessage(data);
			break;
		case 'fmsgr':
			posts = getPostsByMessage(data, true);
			break;
		case 'fflag':
			posts = document.querySelectorAll(`[data-flag="${CSS.escape(data)}"]`);
			break;
		case 'fflagr':
			posts = getPostsByRegex('data-flag', data);
			break;
		default:
			break;
	}
	return [...posts];
};

const setFilterState = (type, data, state) => {
	const addOrDelete = state ? 'add' : 'delete';
	switch (type) {
		case 'single':
			single[addOrDelete](data);
			break;
		case 'fid':
			fid[addOrDelete](data);
			break;
		case 'fname':
			fname[addOrDelete](data);
			break;
		case 'fnamer':
			fnamer = fnamer.filter(r => r.source != data.source);
			if (state) {
				fnamer.push(data);
			}
			break;
		case 'ftrip':
			ftrip[addOrDelete](data);
			break;
		case 'ftripr':
			ftripr = ftripr.filter(r => r.source != data.source);
			if (state) {
				ftripr.push(data);
			}
			break;
		case 'fsub':
			fsub[addOrDelete](data);
			break;
		case 'fsubr':
			fsubr = fsubr.filter(r => r.source != data.source);
			if (state) {
				fsubr.push(data);
			}
			break;
		case 'fmsg':
			fmsg[addOrDelete](data);
			break;
		case 'fmsgr':
			fmsgr = fmsgr.filter(r => r.source != data.source);
			if (state) {
				fmsgr.push(data);
			}
			break;
		case 'fflag':
			fflag[addOrDelete](data);
			break;
		case 'fflagr':
			fflagr = fflagr.filter(r => r.source != data.source);
			if (state) {
				fflagr.push(data);
			}
			break;
		default:
			break;
	}
};

const toggleFilter = (filterType, filterData, state) => {
	const posts = getPostsByFilter(filterType, filterData);
	setFilterState(filterType, filterData, state);
	togglePostsHidden(posts, state, filterType === 'single');
	updateSavedFilters();
};

//i guess this works, lmfao and saves ton of time
let actionForm, modalBg, moderatingPost;
const cancelModeratePost = (e) => {
	if (!moderatingPost) {
		return;
	}
	e.preventDefault();
	moderatingPost.querySelector('.post-check').checked = false;
	moderatingPost.style.zIndex = 'unset';
	if (moderatingPost.classList.contains('op')) {
		moderatingPost.style.background = 'unset';
	}
	modalBg.style.display = 'none';
	modalBg.style.zIndex = 4;
	actionForm.removeAttribute('open');
	moderatingPost = null;
};
const moderatePost = (postContainer) => {
	moderatingPost = postContainer;
	actionForm.classList.add('floatactions');
	actionForm.setAttribute('open', 'open');
	actionForm.style.zIndex = 3;
	postContainer.style.zIndex = 3;
	if (postContainer.classList.contains('op')) {
		postContainer.style.background = 'var(--post-color)';
	}
	modalBg.style.display = 'unset';
	modalBg.style.zIndex = 3;
	const actionCaptcha = actionForm.querySelector('.captchafield');
	const postCheck = postContainer.querySelector('.post-check');
	Array.from(postCheck.form.elements)
		.filter(e => e.name === 'checkedposts')
		.forEach(e => e.checked = false);
	postCheck.checked = true;
	if (actionCaptcha) {
		captchaController.loadCaptcha(actionCaptcha);
	}
};

const postMenuChange = function() {
	const postContainer = this.closest(isCatalog ? '.catalog-tile': '.post-container');
	const postDataset = postContainer.dataset;
	const filterType = this.value;
	const hiding = !postContainer.classList.contains('hidden');
	this.value = '';
	let filterData;
	switch (filterType) {
		case 'single':
			filterData = `${postDataset.board}-${postDataset.postId}`;
			break;
		case 'fid':
			filterData = postDataset.userId;
			break;
		case 'fname':
			filterData = postDataset.name;
			break;
		case 'ftrip':
			filterData = postDataset.tripcode;
			break;
		case 'fsub':
			filterData = postDataset.subject;
			break;
		case 'fflag':
			filterData = postDataset.flag;
			break;
		case 'moderate':
			return moderatePost(postContainer);
		case 'edit':
			return window.location = `/${postDataset.board}/manage/editpost/${postDataset.postId}.html`;
		case 'watch': {
			const postMessage = postContainer.querySelector('.post-message');
			const watcherSubject = (postDataset.subject || (postMessage && postMessage.textContent) || `#${postDataset.postId}`).substring(0, 25);
			threadWatcher.add(postDataset.board, postDataset.postId, { subject: watcherSubject, unread: 0, updatedDate: new Date() });
			return;
		}
		case 'playlist':{
			console.log('creating playlist...');
			window.dispatchEvent(new CustomEvent('createPlaylist', {
				detail:{
					board:postDataset.board,
					postId:postDataset.postId
				}
			}));
			break;
		}
	}
	toggleFilter(filterType, filterData, hiding);
};

for (let menu of document.getElementsByClassName('postmenu')) {
	menu.value = '';
	menu.addEventListener('change', postMenuChange, false);
}

const getHiddenElems = () => {
	let posts = [];
	for (let elem of single) {
		posts = posts.concat(getPostsByFilter('single', elem));
	}
	for (let id of fid) {
		posts = posts.concat(getPostsByFilter('fid', id));
	}
	for (let name of fname) {
		posts = posts.concat(getPostsByFilter('fname', name));
	}
	for (let tripcode of ftrip) {
		posts = posts.concat(getPostsByFilter('ftrip', tripcode));
	}
	for (let subject of fsub) {
		posts = posts.concat(getPostsByFilter('fsub', subject));
	}
	for (let message of fmsg) {
		posts = posts.concat(getPostsByFilter('fmsg', message));
	}
	for (let flag of fflag) {
		posts = posts.concat(getPostsByFilter('fflag', flag));
	}
	for (let namer of fnamer) {
		posts = posts.concat(getPostsByFilter('fnamer', namer));
	}
	for (let tripcoder of ftripr) {
		posts = posts.concat(getPostsByFilter('ftripr', tripcoder));
	}
	for (let subr of fsubr) {
		posts = posts.concat(getPostsByFilter('fsubr', subr));
	}
	for (let messager of fmsgr) {
		posts = posts.concat(getPostsByFilter('fmsgr', messager));
	}
	for (let flagr of fflagr) {
		posts = posts.concat(getPostsByFilter('fflagr', flagr));
	}
	return posts;
};

togglePostsHidden(getHiddenElems(), true);

window.addEventListener('addPost', function(e) {
	const newPost = e.detail.post;
	if (anyFilterMatches(newPost)) {
		newPost.classList.add('hidden');
	}
	if (e.detail.hover) { return; }
	const menu = newPost.querySelector('.postmenu');
	menu.value = '';
	menu.addEventListener('change', postMenuChange, false);
});

window.addEventListener('updatePostMessage', function(e) {
	const newPost = e.detail.post;
	if (anyFilterMatches(newPost)) {
		newPost.classList.add('hidden');
	}
});

window.addEventListener('settingsReady', function() {

	actionForm = document.getElementById('actionform');
	if (actionForm) {
		modalBg = document.querySelector('.modal-bg');
		actionForm.firstChild.addEventListener('click', cancelModeratePost);
		modalBg.addEventListener('click', cancelModeratePost, false);
	}

	filtersTable = document.getElementById('advancedfilters');
	updateFiltersTable();

	const filtersForm = document.getElementById('filter-form');
	filtersForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const isRegex = filtersForm.elements.regex.checked;
		const type = `${filtersForm.elements.type.value}${isRegex ? 'r' : ''}`;
		const val = isRegex ? new RegExp(filtersForm.elements.value.value, 'i') : filtersForm.elements.value.value;
		console.log('adding filter', type, val);
		toggleFilter(type, val, true);
	});

	const filterClearButton = document.getElementById('filters-clear');
	const clearFilters = () => {
		single = new Set(),
		fid = new Set(),
		fname = new Set(),
		ftrip = new Set(),
		fsub = new Set(),
		fmsg = new Set(),
		fflag = new Set(),
		fnamer = [],
		ftripr = [],
		fsubr = [],
		fmsgr = [],
		fflagr = [],
		updateFiltersTable();
		togglePostsHidden(document.querySelectorAll(`.${isCatalog ? 'catalog-tile': 'post-container' }`), false);
		updateSavedFilters();
		console.log('cleared hidden posts');
	};
	filterClearButton.addEventListener('click', clearFilters, false);

});
