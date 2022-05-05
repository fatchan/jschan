'use strict';

module.exports = async(db, redis) => {
	console.log('moving globalsettings from redis into mongodb');
	const oldSettings = await redis.get('globalsettings');
	if (oldSettings) {
		await db.collection('globalsettings').replaceOne({ _id: 'globalsettings' }, oldSettings, { upsert: true });
	}
};
