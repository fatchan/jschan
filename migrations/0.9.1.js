'use strict';

module.exports = async(db, redis) => {
	console.log('make captcha font option apply to grid captcha too');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$unset': {
			'captchaOptions.text.font': '',
		},
		'$set': {
			'captchaOptions.font': 'default',
		}
	});
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
};
