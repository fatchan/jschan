'use strict';

const session = require('express-session')
	, redisStore = require('connect-redis')(session)
	, { cookieSecret, secureCookies } = require(__dirname+'/../configs/main.js')
	, { redisClient } = require(__dirname+'/../redis.js')
	, production = process.env.NODE_ENV === 'production'
	, { DAY } = require(__dirname+'/timeutils.js')
	, sessionMiddlewareCache = {};

module.exports = (req, res, next) => {

	const proto = req.headers['x-forwarded-proto'];
	const sessionMiddleware = sessionMiddlewareCache[proto] || (sessionMiddlewareCache[proto] = session({
			secret: cookieSecret,
			store: new redisStore({
				client: redisClient,
			}),
			resave: false,
			saveUninitialized: false,
			rolling: true,
			cookie: {
				httpOnly: true,
				secure: secureCookies && production && (proto === 'https'),
				sameSite: 'strict',
				maxAge: DAY,
			}
	}));
	return sessionMiddleware(req, res, next);

}
