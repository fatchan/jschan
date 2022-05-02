'use strict';

module.exports = async(db, redis) => {
	console.log('add markdown permissions');
	const settings = await redis.get('globalsettings');
	const newSettings = {
		...settings,
		permLevels: {
			markdown: {
				pink: 4,
				green: 4,
				bold: 4,
				underline: 4,
				strike: 4,
				italic: 4,
				title: 4,
				spoiler: 4,
				mono: 4,
				code: 4,
				link: 4,
				detected: 4,
				dice: 4,
				fortune: 0,
			},
		},
	};
	redis.set('globalsettings', newSettings);
};
