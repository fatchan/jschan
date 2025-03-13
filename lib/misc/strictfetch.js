'use strict';

const fetchTimeout = 10000; //TODO: is this long enough for most nft metas?

async function strictFetch(url) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), fetchTimeout);
	try {
		const response = await fetch(url, { signal: controller.signal });
		if (!response.ok) {
			throw new Error(`strictFetch not ok, status: ${response.status}`);
		}
		return await response.json();
	} catch (error) {
		if (error.name === 'AbortError') {
			console.error('strictFetch request aborted due to timeout');
		} else {
			console.error('strictFetch error:', error);
		}
		return null;
	} finally {
		clearTimeout(timeoutId); //cleanup the abortcontroller timeout
	}
}

module.exports = strictFetch;
