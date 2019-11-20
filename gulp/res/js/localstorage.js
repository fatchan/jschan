function setLocalStorage(key, value) {
	try {
		localStorage.setItem(key, value);
	} catch (e) {
		//clears hover cache when storage gets too large
		const hoverCaches = Object.keys(localStorage).filter(k => k.startsWith('hovercache'));
		for(let i = 0; i < hoverCaches.length; i++) {
			localStorage.removeItem(hoverCaches[i]);
		}
	} finally {
		localStorage.setItem(key, value);
	}
}
