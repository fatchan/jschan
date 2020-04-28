if (isCatalog) {
	window.addEventListener('DOMContentLoaded', (event) => {

		const getFilterSelector = (filter) => {
			filter = filter.replace(/["\\]/g, '\\$&').toLowerCase();
			return `.catalog-tile:not([data-filter*="${filter}"])`;
		}
		const catalogFilter = document.getElementById('catalogfilter');
		catalogFilter.value = '';
		const filterCatalog = () => {
			let existingRule;
			let i = 0;
		    for (; i < renderSheet[rulesKey].length; i++) {
	            if (renderSheet[rulesKey][i].selectorText.startsWith('.catalog-tile:not([data-filter*=')) {
					existingRule = renderSheet[rulesKey][i];
					break;
	            }
	        }
			if (catalogFilter.value.length > 0) {
				if (existingRule) {
					existingRule.selectorText = getFilterSelector(catalogFilter.value);
				} else {
		            renderSheet.insertRule(getFilterSelector(catalogFilter.value) + ' { display: none; }');
				}
	        } else {
		        renderSheet.deleteRule(i);
			}
		}
		catalogFilter.addEventListener('input', filterCatalog, false);

		const sorts = {
			date: (a, b) => {
				//date newest first
				return new Date(b.dataset.date) - new Date(a.dataset.date);
			},
			bump: (a, b) => {
				//bump date most recent first
				return a.dataset.bump - b.dataset.bump;
			},
			replies: (a, b) => {
				//replies most first
				return b.dataset.replies - a.dataset.replies;
			},
		}
		const tiles = document.getElementsByClassName('catalog-tile');
		const catalogSort = document.getElementById('catalogsort');
		catalogSort.value = '';
		const sortCatalog = (mode) => {
			console.log('sorting catalog', mode);
			const tiles = document.getElementsByClassName('catalog-tile');
			const tilesArray = Array.from(tiles);
			tilesArray
				.sort(sorts[mode] || (() => 1))
				.forEach((tile, index) => {
					tile.style.order = index;
				});
		}
		catalogSort.addEventListener('change', (e) => { sortCatalog(e.target.value) }, false);

	});
}
