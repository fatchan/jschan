'use strict';

const session = require('express-session')
	, uid = require('uid-safe').sync
	, redisStore = require('connect-redis')(session)
	, { cookieSecret } = require(__dirname+'/../../../configs/secrets.js')
	, config = require(__dirname+'/../../misc/config.js')
	, { redisClient } = require(__dirname+'/../../redis/redis.js')
	, production = process.env.NODE_ENV === 'production'
	, { DAY } = require(__dirname+'/../../converter/timeutils.js')
	, sessionMiddlewareCache = {};

module.exports = (req, res, next) => {

	const { secureCookies } = config.get;
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
			maxAge: 3 * DAY,
		},
		genid: (req) => {
			//add user identifier to session id
			//https://github.com/expressjs/session/blob/master/index.js#L518
			let id = uid(24);
			if (req.path === '/login' && req.body.username) {
				id += `:${req.body.username}`;
			}
			return id;
		},
	}));
	return sessionMiddleware(req, res, next);

};
