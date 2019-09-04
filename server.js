'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

const express = require('express')
	, session = require('express-session')
	, redisStore = require('connect-redis')(session)
	, path = require('path')
	, app = express()
	, bodyParser = require('body-parser')
	, cookieParser = require('cookie-parser')
	, configs = require(__dirname+'/configs/main.json')
	, ipHash = require(__dirname+'/helpers/iphash.js')
	, referrerCheck = require(__dirname+'/helpers/referrercheck.js')
	, themes = require(__dirname+'/helpers/themes.js')
	, Mongo = require(__dirname+'/db/db.js');

(async () => {

	console.log('STARTING IN MODE:', process.env.NODE_ENV);

	// connect to mongodb
	console.log('CONNECTING TO MONGODB');
	await Mongo.connect();

	// connect to redis
	console.log('CONNECTING TO REDIS');
	const { redisClient } = require(__dirname+'/redis.js');

	// disable useless express header
	app.disable('x-powered-by');
	// parse forms (is json required?)
	app.use(bodyParser.urlencoded({extended: true}));
	app.use(bodyParser.json());
	// parse cookies
	app.use(cookieParser());

	// session store
	app.use(session({
		secret: configs.sessionSecret,
		store: new redisStore({
			client: redisClient,
		}),
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
		}
	}));

	//trust proxy for nginx
	app.set('trust proxy', 1);

	//self explanatory middlewares
	app.use(ipHash);
	app.use(referrerCheck);

	// use pug view engine
	app.set('view engine', 'pug');
	app.set('views', path.join(__dirname, 'views/pages'));
	//cache loaded templates
	if (configs.cacheTemplates === true) {
		app.enable('view cache');
	}

	//default settings
	app.locals.defaultTheme = configs.boardDefaults.theme;
	app.locals.globalLimits = configs.globalLimits
	app.locals.themes = themes;

	// routes
	app.use('/forms', require(__dirname+'/controllers/forms.js'));
	app.use('/', require(__dirname+'/controllers/pages.js'));

	//404 catchall
	app.get('*', (req, res) => {
		res.status(404).render('404');
	})

	// catch any unhandled errors
	app.use((err, req, res, next) => {
		if (err.code === 'EBADCSRFTOKEN') {
			return res.status(403).send('Invalid CSRF token');
		}
		console.error(err.stack);
		return res.status(500).render('message', {
			'title': 'Internal Server Error',
			'redirect': req.headers.referer || '/'
		});
	})

	//listen
	const server = app.listen(configs.port, '127.0.0.1', () => {
		console.log(`listening on port ${configs.port}`);
		//let PM2 know that this is ready for graceful reloads and to serialise startup
		if (typeof process.send === 'function') {
			//make sure we are a child process of PM2 i.e. not in dev
			console.info('sending ready signal to PM2');
			process.send('ready');
		}
	});

	//listen for sigint from PM2
	process.on('SIGINT', () => {
		console.info('SIGINT SIGNAL RECEIVED');
		// Stops the server from accepting new connections and finishes existing connections.
		server.close((err) => {
			// if error, log and exit with error (1 code)
			console.info('CLOSING SERVER');
			if (err) {
				console.error(err);
				process.exit(1);
			}
			// close database connection
			console.info('DISCONNECTING MONGODB');
			Mongo.client.close();
			//close redis connection
			console.log('DISCONNECTING REDIS')
			redisClient.quit();
			// now close without error
			process.exit(0);
		});
	});

})();
