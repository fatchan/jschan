'use strict';

const session = require('express-session')
	, redisStore = require('connect-redis')(session)
	, { cookieSecret, secureCookies } = require(__dirname+'/../configs/main.js')
	, { redisClient } = require(__dirname+'/../redis.js')
	, production = process.env.NODE_ENV === 'production'
	, { DAY } = require(__dirname+'/timeutils.js');

module.exports = session({
	secret: cookieSecret,
	store: new redisStore({
		client: redisClient,
	}),
	resave: false,
	saveUninitialized: false,
	rolling: true,
	cookie: {
		httpOnly: true,
		secure: secureCookies && production,
		sameSite: 'strict',
		maxAge: DAY,
	}
});
