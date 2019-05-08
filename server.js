'use strict';

process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);

const express  = require('express')
	, session  = require('express-session')
	, MongoStore = require('connect-mongo')(session)
	, path	 = require('path')
	, app	  = express()
	, helmet = require('helmet')
	, bodyParser = require('body-parser')
	, cookieParser = require('cookie-parser')
	, configs = require(__dirname+'/configs/main.json')
	, Mongo = require(__dirname+'/db/db.js')
	, upload = require('express-fileupload');

(async () => {

	// let db connect
	await Mongo.connect();

	// parse forms and allow file uploads
	app.use(bodyParser.urlencoded({extended: true}));
	app.use(bodyParser.json());
	app.use(upload({
		createParentPath: true,
		safeFileNames: true,
		preserveExtension: 4,
		limits: {
			fileSize: 10 * 1024 * 1024,
			files: 3
		},
		abortOnLimit: true,
		useTempFiles: true,
		tempFileDir: path.join(__dirname+'/tmp/')
	}));

	// session store
	app.use(session({
		secret: configs.sessionSecret,
		store: new MongoStore({ db: Mongo.client.db('sessions') }),
		resave: false,
		saveUninitialized: false
	}));
	app.use(cookieParser());

	// csurf and helmet
	app.use(helmet());

	//referer header check
	app.use((req, res, next) => {
		if (req.method !== 'POST') {
			return next();
		}
		if (!req.headers.referer || !req.headers.referer.match(/^https:\/\/(www\.)?fatpeople\.lol/)) {
			return res.status(403).render('message', {
				'title': 'Forbidden',
				'message': 'Invalid or missing "Referer" header. Are you posting from the correct URL?'
			})
		}
		next();
	})

	// use pug view engine
	app.set('view engine', 'pug');
	app.set('views', path.join(__dirname, 'views/pages'));
	app.enable('view cache');

	// routes
	app.use('/forms', require(__dirname+'/controllers/forms.js'))
	app.use('/', require(__dirname+'/controllers/pages.js'))

	//404 catchall
	app.get('*', (req, res) => {
		res.status(404).render('404')
	})

	// catch any unhandled errors
	app.use((err, req, res, next) => {
		if (err.code === 'EBADCSRFTOKEN') {
			return res.status(403).send('Invalid CSRF token')
		}
		console.error(err.stack)
		return res.status(500).render('message', {
			'title': 'Internal Server Error',
			'redirect': req.headers.referer || '/'
		})
	})

	// listen
	app.listen(configs.port, () => {
        console.log(`Listening on port ${configs.port}`);
    });

})();
