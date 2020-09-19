const fileInput = document.getElementById('file');
if (fileInput) {
	//not using display: none because we still want to show the browser prompt for a "required" file
	fileInput.style.position = 'absolute';
	fileInput.style.border = 'none';
	fileInput.style.height = '0';
	fileInput.style.width = '0';
	fileInput.style.opacity = '0';
}

//lists separate until i come up with something better
let hidePostsList;
let { hiddenSingle, filteredId, filteredName, filteredTripcode } = JSON.parse(localStorage.getItem('filters'));
hiddenSingle = new Set(hiddenSingle);
filteredId = new Set(filteredId);
filteredName = new Set(filteredName);
filteredTripcode = new Set(filteredTripcode);

const updateSavedFilters = () => {
	hidePostsList.value = [...hiddenSingle, ...filteredId, ...filteredName, ...filteredTripcode];
	setLocalStorage('filters', JSON.stringify({
		hiddenSingle: [...hiddenSingle],
		filteredId: [...filteredId],
		filteredName: [...filteredName],
		filteredTripcode: [...filteredTripcode],
	}));
}

const togglePostsHidden = (posts, state) => {
	for (let elem of posts) {
		elem.classList[state ? 'add' : 'remove']('hidden');
	}
}

const getPostsByFilter = (type, data) => {
	let posts = [];
	switch (type) {
		case 'hide':
			const post = document.querySelector(`[data-board="${data.board}"][data-post-id="${data.postId}"]`);
			posts = post ? [post] : [];
			break;
		case 'id':
			posts = document.querySelectorAll(`[data-user-id="${data.userId}"]`);
			break;
		case 'name':
			posts = document.querySelectorAll(`[data-name="${CSS.escape(data.name)}"]`);
			break;
		case 'tripcode':
			posts = document.querySelectorAll(`[data-tripcode="${CSS.escape(data.tripcode)}"]`);
			break;
		default:
			break;
	}
	return [...posts]
}

const setFilterState = (type, data, state) => {
	switch (type) {
		case 'hide':
			hiddenSingle[state ? 'add' : 'delete'](`${data.board}-${data.postId}`);
			break;
		case 'id':
			filteredId[state ? 'add' : 'delete'](data.userId);
			break;
		case 'name':
			filteredName[state ? 'add' : 'delete'](data.name);
			break;
		case 'tripcode':
			filteredTripcode[state ? 'add' : 'delete'](data.tripcode);
			break;
		default:
			break;
	}
}

const postMenuChange = function(e) {
	const postContainer = this.parentElement.parentElement.parentElement;
	const filterType = this.value;
	const posts = getPostsByFilter(filterType, postContainer.dataset);
	if (posts.length === 0) { return; }
//TODO: unhiding
	setFilterState(filterType, postContainer.dataset, true);
	this.value = '';
	togglePostsHidden(posts, true);
	updateSavedFilters();
}

for (let menu of document.getElementsByClassName('postmenu')) {
	menu.value = '';
	menu.addEventListener('change', postMenuChange, false);
}

const getHiddenElems = () => {
	let posts = [];
	for (let elem of hiddenSingle) {
		const [board, postId] = elem.split('-');
		posts = posts.concat(getPostsByFilter('hide', { board, postId }));
	}
	for (let id of filteredId) {
		posts = posts.concat(getPostsByFilter('id', { userId: id }));
	}
	for (let name of filteredName) {
		posts = posts.concat(getPostsByFilter('name', { name }));
	}
	for (let tripcode of filteredTripcode) {
		posts = posts.concat(getPostsByFilter('tripcode', { tripcode }));
	}
	return posts;
}

togglePostsHidden(getHiddenElems(), true);

window.addEventListener('addPost', function(e) {
	const post = e.detail.post;
	const { board, postId, userId, name, tripcode } = post.dataset;
	if (filteredId.has(userId)
		|| filteredName.has(name)
		|| filteredTripcode.has(tripcode)) {
		post.classList.add('hidden');
	}
	const menu = post.querySelector('.postmenu');
	menu.value = '';
	menu.addEventListener('change', postMenuChange, false);

});

window.addEventListener('settingsReady', function(e) {

	hidePostsList = document.getElementById('hiddenpostslist-setting');
	hidePostsList.value = [...hiddenSingle, ...filteredId, ...filteredName, ...filteredTripcode];

	const hidePostsListClearButton = document.getElementById('hiddenpostslist-clear');
	const clearhidePostsList = () => {
		togglePostsHidden(getHiddenElems(), false);
		hidePostsList.value = '';
		hiddenSingle = new Set();
		filteredId = new Set();
		filteredName = new Set();
		filteredTripcode = new Set();
		updateSavedFilters();
		console.log('cleared hidden posts');
	}
	hidePostsListClearButton.addEventListener('click', clearhidePostsList, false);

});
