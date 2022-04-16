'use strict';

const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
	, k = 1024;

module.exports = (bytes) => {
	if (bytes === 0)  {
		return '0B';
	}
	const i = Math.min(sizes.length-1, Math.floor(Math.log(bytes) / Math.log(k)));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))}${sizes[i]}`;
};
