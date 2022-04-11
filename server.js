'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

const config = require(__dirname+'/lib/misc/config.js')
	, express = require('express')
	, path = require('path')
	, app = express()
	, server = require('http').createServer(app)
	, cookieParser = require('cookie-parser')
	, { port, cookieSecret, debugLogs, google, hcaptcha } = require(__dirname+'/configs/secrets.js')
	, Mongo = require(__dirname+'/db/db.js')
	, dynamicResponse = require(__dirname+'/lib/misc/dynamic.js')
	, commit = require(__dirname+'/lib/misc/commit.js')
	, { version } = require(__dirname+'/package.json')
	, formatSize = require(__dirname+'/lib/converter/formatsize.js')
	, CachePugTemplates = require('cache-pug-templates')
	, Permissions = require(__dirname+'/lib/permission/permissions.js');

(async () => {

	const env = process.env.NODE_ENV;
	const production = env === 'production';
	debugLogs && console.log('process.env.NODE_ENV =', env);

	// connect to mongodb
	debugLogs && console.log('CONNECTING TO MONGODB');
	await Mongo.connect();
	await Mongo.checkVersion();
	await config.load();

	// connect to redis
	debugLogs && console.log('CONNECTING TO REDIS');
	const redis = require(__dirname+'/lib/redis/redis.js');

	// load roles early
	const roleManager = require(__dirname+'/lib/permission/rolemanager.js');
	await roleManager.load();

	// disable useless express header
	app.disable('x-powered-by');
	//query strings
	app.set('query parser', 'simple');
	// parse forms
	app.use(express.urlencoded({extended: false}));
	// parse cookies
	app.use(cookieParser(cookieSecret));

	// session store
	const sessionMiddleware = require(__dirname+'/lib/middleware/permission/usesession.js');

	// connect socketio
	const Socketio = require(__dirname+'/lib/misc/socketio.js');
	debugLogs && console.log('STARTING WEBSOCKET');
	Socketio.connect(server, sessionMiddleware);

	//trust proxy for nginx
	app.set('trust proxy', 1);

	//self explanatory middlewares
	const referrerCheck = require(__dirname+'/lib/middleware/misc/referrercheck.js');
	app.use(referrerCheck);

	// use pug view engine
	const views = path.join(__dirname, 'views/pages');
	app.set('view engine', 'pug');
	app.set('views', views);

	const loadAppLocals = () => {
		const { cacheTemplates, boardDefaults, globalLimits, captchaOptions, archiveLinksURL,
			reverseImageLinksURL, debugLogs, meta, enableWebring, globalAnnouncement } = config.get;
		//cache loaded templates
		app.cache = {};
		app[cacheTemplates === true ? 'enable' : 'disable']('view cache');
		//default settings
		app.locals.Permissions = Permissions;
		app.locals.defaultTheme = boardDefaults.theme;
		app.locals.defaultCodeTheme = boardDefaults.codeTheme;
		app.locals.globalLimits = globalLimits;
		app.locals.archiveLinksURL = archiveLinksURL;
		app.locals.reverseImageLinksURL = reverseImageLinksURL;
		app.locals.enableWebring = enableWebring;
		app.locals.commit = commit;
		app.locals.version = version;
		app.locals.meta = meta;
		app.locals.captchaType = captchaOptions.type;
		app.locals.postFilesSize = formatSize(globalLimits.postFilesSize.max);
		app.locals.googleRecaptchaSiteKey = google.siteKey;
		app.locals.hcaptchaSiteKey = hcaptcha.siteKey;
		app.locals.captchaGridSize = captchaOptions.grid.size;
		app.locals.globalAnnouncement = globalAnnouncement;
	}
	loadAppLocals();
	redis.addCallback('config', loadAppLocals);

	// routes
	if (!production) {
		app.use(express.static(__dirname+'/static', { redirect: false }));
		app.use(express.static(__dirname+'/static/html', { redirect: false }));
		app.use(express.static(__dirname+'/static/json', { redirect: false }));
	}

	app.use('/forms', require(__dirname+'/controllers/forms.js'));
	app.use('/', require(__dirname+'/controllers/pages.js'));

	//404 catchall
	app.get('*', (req, res) => {
		res.status(404).render('404');
	})

	// catch any unhandled errors
	app.use((err, req, res, next) => {
		let errStatus = 500;
		let errMessage = 'Internal Server Error';
		if (err.code === 'EBADCSRFTOKEN') {
			errMessage = 'Invalid CSRF token';
			errStatus= 403;
		}
		if (err.type != null) {
			//body-parser errors
			errStatus = err.status;
			switch (err.type) {
				case 'charset.unsupported':
				case 'entity.parse.failed':
				case 'entity.verify.failed':
				case 'encoding.unsupported':
				case 'request.size.invalid':
				case 'parameters.too.many':
					//no need to give an error for every one, since these will never happen to a legit user anyway
					errMessage = 'Invalid request body';
					break;
				case 'request.aborted':
					errMessage = 'Client aborted request';
					break;
				case 'entity.too.large':
					errMessage = 'Your upload was too large';
					break;
				default:
					break;
			}
		}
		if (errStatus === 500 && errMessage ===  'Internal Server Error') {
			//no specific/friendly error, probably something worth logging
			console.error(err);
		}
		return dynamicResponse(req, res, errStatus, 'message', {
			'title': errStatus === 500 ? 'Internal Server Error' : 'Bad Request',
			'error': errMessage,
			'redirect': req.headers.referer || '/'
		});
	})

	//listen
	server.listen(port, (process.env.JSCHAN_IP || '127.0.0.1'), () => {
		new CachePugTemplates({ app, views }).start();
		debugLogs && console.log(`LISTENING ON :${port}`);
		//let PM2 know that this is ready for graceful reloads and to serialise startup
		if (typeof process.send === 'function') {
			//make sure we are a child process of PM2 i.e. not in dev
			debugLogs && console.log('SENT READY SIGNAL TO PM2');
			process.send('ready');
		}
	});

	const gracefulStop = () => {
		debugLogs && console.log('SIGINT SIGNAL RECEIVED');
		// Stops the server from accepting new connections and finishes existing connections.
		Socketio.io.close((err) => {
			// if error, log and exit with error (1 code)
			debugLogs && console.log('CLOSING SERVER');
			if (err) {
				console.error(err);
				process.exit(1);
			}
			// close database connection
			debugLogs && console.log('DISCONNECTING MONGODB');
			Mongo.client.close();
			//close redis connection
			debugLogs && console.log('DISCONNECTING REDIS')
			redis.close();
			// now close without error
			process.exit(0);
		});
	};

	//graceful stop
	process.on('SIGINT', gracefulStop);
	process.on('message', (message) => {
		if (message === 'shutdown') {
			gracefulStop();
		}
	});

})();
