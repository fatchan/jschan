'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

const express = require('express')
	, session = require('express-session')
	, redisStore = require('connect-redis')(session)
	, path = require('path')
	, app = express()
	, server = require('http').createServer(app)
	, cookieParser = require('cookie-parser')
	, configs = require(__dirname+'/configs/main.json')
	, processIp = require(__dirname+'/helpers/processip.js')
	, referrerCheck = require(__dirname+'/helpers/referrercheck.js')
	, themes = require(__dirname+'/helpers/themes.js')
	, Mongo = require(__dirname+'/db/db.js')
	, Socketio = require(__dirname+'/socketio.js')
	, dynamicResponse = require(__dirname+'/helpers/dynamic.js')
	, CachePugTemplates = require('cache-pug-templates');

(async () => {

	console.log('STARTING IN MODE:', process.env.NODE_ENV);

	// connect to mongodb
	console.log('CONNECTING TO MONGODB');
	await Mongo.connect();

	// connect to redis
	console.log('CONNECTING TO REDIS');
	const { redisClient } = require(__dirname+'/redis.js');

	// connect socketio
	console.log('STARTING WEBSOCKET');
	Socketio.connect(server);

	// disable useless express header
	app.disable('x-powered-by');
	// parse forms
	app.use(express.urlencoded({extended: true}));
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
	app.use(processIp);
	app.use(referrerCheck);

	// use pug view engine
	const views = path.join(__dirname, 'views/pages');
	app.set('view engine', 'pug');
	app.set('views', views);
	//cache loaded templates
	if (configs.cacheTemplates === true) {
		app.enable('view cache');
	}

	//default settings
	app.locals.defaultTheme = configs.boardDefaults.theme;
	app.locals.globalLimits = configs.globalLimits;
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
		return dynamicResponse(req, res, 500, 'message', {
			'title': 'Internal Server Error',
			'error': 'Internal Server Error', //what to put here?
			'redirect': req.headers.referer || '/'
		});
	})

	//listen
	server.listen(configs.port, '127.0.0.1', () => {
		new CachePugTemplates({ app, views }).start();
		console.log(`LISTENING ON :${configs.port}`);
		//let PM2 know that this is ready for graceful reloads and to serialise startup
		if (typeof process.send === 'function') {
			//make sure we are a child process of PM2 i.e. not in dev
			console.log('SENT READY SIGNAL TO PM2');
			process.send('ready');
		}
	});

	//listen for sigint from PM2
	process.on('SIGINT', () => {
		console.log('SIGINT SIGNAL RECEIVED');
		// Stops the server from accepting new connections and finishes existing connections.
		Socketio.io.close((err) => {
			// if error, log and exit with error (1 code)
			console.log('CLOSING SERVER');
			if (err) {
				console.error(err);
				process.exit(1);
			}
			// close database connection
			console.log('DISCONNECTING MONGODB');
			Mongo.client.close();
			//close redis connection
			console.log('DISCONNECTING REDIS')
			redisClient.quit();
			// now close without error
			process.exit(0);
		});
	});

})();
