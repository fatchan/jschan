'use strict';

const { isDeepStrictEqual } = require('util')

function getDotProp(obj, prop) {
	return prop
	.split('.')
	.reduce((a, b) => a[b], obj);
}

function includeChildren(template, prop, tasks) {
	return Object.keys(getDotProp(template, prop))
		.reduce((a, x) => {
			a[`${prop}.${x}`] = tasks;
			return a;
		}, {});
}

function compareSettings(entries, oldObject, newObject, maxSetSize) {
	const resultSet = new Set();
	entries.every(entry => {
		const oldValue = getDotProp(oldObject, entry[0]);
		const newValue = getDotProp(newObject, entry[0]);
		if (!isDeepStrictEqual(oldValue, newValue)) {
			entry[1].forEach(t => resultSet.add(t));
		}
		return resultSet.size < maxSetSize;
	});
	return resultSet;
}

module.exports = {
	getDotProp,
	includeChildren,
	compareSettings,
}
