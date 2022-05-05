'use strict';

module.exports = async(db) => {
	console.log('Expiring existing captchas, so new ones get new answer format');
	await db.collection('captcha').deleteMany({});
};
