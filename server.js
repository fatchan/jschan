'use strict';

process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);

const express  = require('express')
	, session  = require('express-session')
	, MongoStore = require('connect-mongo')(session)
	, path	 = require('path')
	, app	  = express()
	, helmet = require('helmet')
	, csrf = require('csurf')
	, bodyParser = require('body-parser')
	, cookieParser = require('cookie-parser')
	, upload = require('express-fileupload')
	, configs = require(__dirname+'/configs/main.json')
	, Mongo = require(__dirname+'/helpers/db.js');

(async () => {

	// let db connect
	await Mongo.connect();

	// parse forms and allow file uploads
	app.use(bodyParser.urlencoded({extended: true}));
	app.use(bodyParser.json());
	app.use(upload({
		createParentPath: true,
		safeFileNames: true,
		preserveExtension: true,
		limits: { fileSize: 50 * 1024 * 1024 },
		abortOnLimit: true
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
	app.use(csrf());

	// use pug view engine
	app.set('view engine', 'pug');
	app.set('views', path.join(__dirname, 'views/pages'));
	app.enable('view cache');

	// static files
	app.use('/css', express.static(__dirname + '/static/css'));
	app.use('/js', express.static(__dirname + '/static/js'));
	app.use('/img', express.static(__dirname + '/static/img'));

	// routes
	const posts = require(__dirname+'/controllers/posts.js');
	//	const modRoutes = require(__dirname+'/controllers/mod.js')()
	app.use('/', posts)
	//	app.use('/', mod)

	//generic error page
	app.get('/error', (req, res) => {
		res.status(500).render('error', {
			user: req.session.user
		})
	})

	//wildcard after all other routes -- how we handle 404s
	app.get('*', (req, res) => {
	res.status(404).render('404', {
			user: req.session.user
		})
	})

	//catch any unhandled errors
	app.use((err, req, res, next) => {
		if (err.code === 'EBADCSRFTOKEN') {
			return res.status(403).send('Invalid CSRF token')
		}
		console.error(err.stack)
		return res.redirect('/error')
	})

	//listen
	app.listen(configs.port, () => {
        console.log(`Listening on port ${configs.port}`);
    });

})();
