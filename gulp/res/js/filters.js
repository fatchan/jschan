const getFiltersFromLocalStorage = () => {
	const savedFilters = JSON.parse(localStorage.getItem('filters'));
	/* i havent actually checked if the serialization overhead is worth the improvement in filter speed, i only assumed.
		So if it turns out this is slower, i'd accept a PR  to change it :^) */
	return savedFilters.reduce((acc, filter) => {
		acc[filter.type].add(filter.type.endsWith('r') ? new RegExp(filter.val) : filter.val);
		return acc;
	}, {
		single: new Set(),
		fid: new Set(),
		fname: new Set(),
		ftrip: new Set(),
		fnamer: new Set(),
		ftripr: new Set(),
	});
};

let { single, fid, fname, ftrip, fnamer, ftripr } = getFiltersFromLocalStorage();

let filtersTable;
const updateFiltersTable = () => {
	[...filtersTable.children].slice(2).forEach(row => row.remove());
	filtersTable.insertAdjacentHTML('beforeend', filters({filterArr: JSON.parse(localStorage.getItem('filters'))}))
	const closeButtons = filtersTable.querySelectorAll('.close');
	for (let elem of closeButtons) {
		const { type: closeType, data: closeData } = elem.dataset;
		elem.addEventListener('click', () => { toggleFilter(closeType, closeData) });
	}
}

const updateSavedFilters = () => {
	setLocalStorage('filters', JSON.stringify([
		...([...single].map(x => ({type:'single', val:x}))),
		...([...fid].map(x => ({type:'fid', val:x}))),
		...([...ftrip].map(x => ({type:'ftrip', val:x}))),
		...([...fname].map(x => ({type:'fname', val:x}))),
		...([...fnamer].map(x => ({type:'fnamer', val:x.source.toString()}))),
		...([...ftripr].map(x => ({type:'ftripr', val:x.source.toString()}))),
	]));
	updateFiltersTable();
};

const anyFilterMatches = (filteringPost) => {
	const { board, postId, userId, name, tripcode } = filteringPost.dataset;
	return fid.has(userId)
		|| fname.has(name)
		|| ftrip.has(tripcode)
//		|| fnamer.some(r => r.test(name))
	//	|| ftripr.some(r => r.test(tripcode))
}

const togglePostsHidden = (posts, state) => {
	for (let elem of posts) {
		if (!state && !anyFilterMatches(elem)) { //possible fix for multiple filters & unhiding conflicts
			elem.classList['remove']('hidden');
		} else {
			elem.classList['add']('hidden');
		}
	}
};

//I wish this wasn't necessary, but css selectors dont support regex :(
const getPostsByRegex = (attribute, regex) => {
	const matches = [];
	for (let elem of document.querySelectorAll(`[${attribute}]`)) {
		const value = element.getAttribute(attribute).toString();
		if (regex.test(value)) {
			matches.push(elem);
		}
	}
	return matches;
};

const getPostsByFilter = (type, data) => {
	let posts = [];
	switch (type) {
		case 'single':
			const [dataBoard, dataPostId] = data.split('-');
			const singlePost = document.querySelector(`[data-board="${dataBoard}"][data-post-id="${dataPostId}"]`);
			posts = singlePost ? [singlePost] : [];
			break;
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
			fnamer[addOrDelete](data.source.toString());
			break;
		case 'ftrip':
			ftrip[addOrDelete](data);
			break;
		case 'ftripr':
			ftripr[addOrDelete](data.source.toString());
			break;
		default:
			break;
	}
};

const toggleFilter = (filterType, filterData, state) => {
	//console.log('filtering', filterType, filterData, state);
	const posts = getPostsByFilter(filterType, filterData);
	if (posts.length === 0) { return; }
	setFilterState(filterType, filterData, state);
	togglePostsHidden(posts, state);
	updateSavedFilters();
}

const postMenuChange = function(e) {
	const postContainer = this.parentElement.parentElement.parentElement;
	const postDataset = postContainer.dataset
	const filterType = this.value;
	const hiding = !postContainer.classList.contains('hidden');
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
	}
	toggleFilter(filterType, filterData, hiding);
	this.value = '';
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

//	for (let namer of fnamer) {
//		posts = posts.concat(getPostsByFilter('fname', namer));
//	}
//	for (let tripcoder of ftripr) {
//		posts = posts.concat(getPostsByFilter('ftrip', tripcoder));
//	}

	return posts;
};

togglePostsHidden(getHiddenElems(), true);

window.addEventListener('addPost', function(e) {
	const newPost = e.detail.post;
	if (anyFilterMatches(newPost)) {
		newPost.classList.add('hidden');
	}
	const menu = newPost.querySelector('.postmenu');
	menu.value = '';
	menu.addEventListener('change', postMenuChange, false);
});

window.addEventListener('settingsReady', function(e) {

	filtersTable = document.getElementById('advancedfilters');
	updateFiltersTable();

	const filterClearButton = document.getElementById('filters-clear');
	const clearFilters = () => {
		single = new Set(),
		fid = new Set(),
		fname = new Set(),
		ftrip = new Set(),
		fnamer = new Set(),
		ftripr = new Set(),
		updateFiltersTable();
		togglePostsHidden(document.querySelectorAll('.post-container'), false);
		updateSavedFilters();
		console.log('cleared hidden posts');
	}
	filterClearButton.addEventListener('click', clearFilters, false);

});
