'use strict';

const redis = require(__dirname+'/../../redis.js');

module.exports = async (req, res, next) => {

	const sessions = await redis.getPattern(`sess:*:${res.locals.user.username}`);

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('sessions', {
		user: res.locals.user,
		permissions: res.locals.permissions,
		currentSessionKey: `sess:${req.sessionID}`,
		sessions,
	});

}
