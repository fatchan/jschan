'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

const express = require('express')
	, session = require('express-session')
	, MongoStore = require('connect-mongo')(session)
	, path = require('path')
	, app = express()
	, bodyParser = require('body-parser')
	, cookieParser = require('cookie-parser')
	, configs = require(__dirname+'/configs/main.json')
	, refererRegex = new RegExp(configs.refererRegex)
	, Mongo = require(__dirname+'/db/db.js')
	, { createHash, randomBytes } = require('crypto');

(async () => {

	console.log('Starting in mode:', process.env.NODE_ENV);

	// let db connect
	console.log('connecting to db');
	await Mongo.connect();

	// disable useless express header
	app.disable('x-powered-by');

	// parse forms
	app.use(bodyParser.urlencoded({extended: true}));
	app.use(bodyParser.json());

	//parse cookies
	app.use(cookieParser());

	// session store
	app.use(session({
		secret: configs.sessionSecret,
		store: new MongoStore({ db: Mongo.client.db('sessions') }),
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

	//referer header check
	app.use((req, res, next) => {
		const ip = req.headers['x-real-ip'] || req.connection.remoteAddress
		const ipHash = createHash('sha256').update(configs.ipHashSecret + ip).digest('base64');
		res.locals.ip = ipHash;
		if (req.method !== 'POST') {
			return next();
		}
		if (configs.refererCheck === true && (!req.headers.referer || !req.headers.referer.match(refererRegex))) {
			return res.status(403).render('message', {
				'title': 'Forbidden',
				'message': 'Invalid or missing "Referer" header. Are you posting from the correct URL?'
			});
		}
		next();
	})

	// use pug view engine
	app.set('view engine', 'pug');
	app.set('views', path.join(__dirname, 'views/pages'));
	if (configs.cacheTemplates === true) {
		app.enable('view cache');
	}

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

	// listen
	const server = app.listen(configs.port, '127.0.0.1', () => {

        console.log(`listening on port ${configs.port}`);

		//let PM2 know that this is ready (for graceful reloads)
		if (typeof process.send === 'function') { //make sure we are a child process
			console.info('sending ready signal to PM2');
			process.send('ready');
		}

    });

	process.on('SIGINT', () => {

		console.info('SIGINT signal received');

		// Stops the server from accepting new connections and finishes existing connections.
		server.close((err) => {

			// if error, log and exit with error (1 code)
			console.info('closing http server');
			if (err) {
				console.error(err);
				process.exit(1);
			}

			// close database connection
			console.info('closing db connection');
			Mongo.client.close();

			// now close without error
			process.exit(0);

		})
	})

})();
