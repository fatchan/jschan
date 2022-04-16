'use strict';

const redis = require(__dirname+'/../../lib/redis/redis.js');

module.exports = async (req, res, next) => {

	let sessions;
	try {
		sessions = await redis.getPattern(`sess:*:${res.locals.user.username}`);
	} catch (err) {
		return next(err);
	}

	res
	.set('Cache-Control', 'private, max-age=5')
	.render('sessions', {
		csrf: req.csrfToken(),
		user: res.locals.user,
		permissions: res.locals.permissions,
		currentSessionKey: `sess:${req.sessionID}`,
		sessions,
	});

}
