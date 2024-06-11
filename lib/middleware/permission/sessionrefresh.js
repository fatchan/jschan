'use strict';

const { Accounts } = require(__dirname+'/../../../db/')
	, { DAY } = require(__dirname+'/../../converter/timeutils.js')
	, cache = require(__dirname+'/../../redis/redis.js')
	, config = require(__dirname+'/../../misc/config.js');

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
					/* For security, only storing a boolean used for checks,
						we dont need/want to store the twofactor secret in session */
					'twofactor': account.twofactor != null,
				};
				req.session.expires = new Date(Date.now() + (3 * DAY));
				cache.set(`users:${req.session.user}`, res.locals.user, 3600);
			}
		}
		const { forceAccountTwofactor } = config.get;
		//Note: not /forms/twofactor because req.path doesnt contain the mount point when called from a middleware
		if (!['/twofactor.html', '/twofactor'].includes(req.path)
			&& forceAccountTwofactor === true
			&& res.locals.user
			&& !res.locals.user.twofactor) {
			return res.redirect('/twofactor.html');
		}
	}
	next();
};
