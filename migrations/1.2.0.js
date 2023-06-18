'use strict';

module.exports = async(db, redis) => {

	console.log('Updating globalsettings to add filter limit');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'globalLimits.filters': {
				max: 50,
			},
		},
	});

	console.log('Updating globalsettings to convert old filters into new filter db format');
	const globalSettings = await db.collection('globalsettings').findOne({ _id: 'globalsettings' });
	if (globalSettings.filters.length > 0) {
		await db.collection('filters').insertOne({
			board: null,
			filters: globalSettings.filters,
			filterMode: globalSettings.filterMode,
			filterMessage: null,
			filterBanDuration: globalSettings.filterBanDuration,
			filterBanAppealable: globalSettings.filterBanAppealable ? true : false,
			strictFiltering: globalSettings.strictFiltering ? true : false,
		});
	}
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$unset': {
			filters: '',
			filterMode: '',
			filterBanDuration: '',
			filterBanAppealable: '',
			strictFiltering: '',
			'boardDefaults.filters': '',
			'boardDefaults.filterMode': '',
			'boardDefaults.filterBanDuration': '',
			'boardDefaults.filterBanAppealable': '',
			'boardDefaults.strictFiltering': '',
		},
	});

	console.log('Updating boards to convert old filters into new filter db format');
	const allBoards = await db.collection('boards').find({}).toArray();
	for (let b of allBoards) {
		if (b.settings.filters.length > 0) {
			await db.collection('filters').insertOne({
				board: b._id,
				filters: b.settings.filters,
				filterMode: b.settings.filterMode,
				filterMessage: null,
				filterBanDuration: b.settings.filterBanDuration,
				filterBanAppealable: b.settings.filterBanAppealable ? true : false,
				strictFiltering: b.settings.strictFiltering ? true : false,
			});
		}
	}
	await db.collection('boards').updateMany({}, {
		'$unset': {
			'settings.filters': '',
			'settings.filterMode': '',
			'settings.filterBanDuration': '',
			'settings.filterBanAppealable': '',
			'settings.strictFiltering': '',
		},
	});
	
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
	console.log('Clearing boards cache');
	await redis.deletePattern('board:*');

};
