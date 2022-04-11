'use strict';

const { Accounts } = require(__dirname+'/../../../db/')
	, { DAY } = require(__dirname+'/../../converter/timeutils.js')
	, cache = require(__dirname+'/../../redis/redis.js');

module.exports = async (req, res, next) => {
	if (!res.locals) {
		res.locals = {};
	}
	if (req.session && req.session.user) {
		res.locals.user = await cache.get(`users:${req.session.user}`);
		if (!res.locals.user) {
			const account = await Accounts.findOne(req.session.user);
			if (!account) {
				req.session.destroy();
			} else {
				await Accounts.updateLastActiveDate(req.session.user);
				res.locals.user = {
					'username': account._id,
					'permissions': account.permissions.toString('base64'),
					'staffBoards': account.staffBoards,
					'ownedBoards': account.ownedBoards,
				};
				req.session.expires = new Date(Date.now() + DAY);
				cache.set(`users:${req.session.user}`, res.locals.user, 3600);
			}
		}
	}
	next();
}
