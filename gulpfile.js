'use strict';

const gulp = require('gulp')
	, less = require('gulp-less')
	, cleanCSS = require('gulp-clean-css')
	, del = require('del')
	, pug = require('gulp-pug')
	, paths = {
		styles: {
			src: 'gulp/res/css/*.css',
			dest: 'static/css/'
		},
		images: {
			src: 'gulp/res/img/*',
			dest: 'static/img/'
		},
		pug: {
			src: 'views/custompages/*.pug',
			dest: 'static/html/'
		}
	};

async function wipe() {
	const Mongo = require(__dirname+'/db/db.js');
	await Mongo.connect();
	const Boards = require(__dirname+'/db/boards.js')
		, Posts = require(__dirname+'/db/posts.js')
		, Bans = require(__dirname+'/db/bans.js')
		, Captchas = require(__dirname+'/db/captchas.js')
		, Accounts = require(__dirname+'/db/accounts.js')
		, Files = require(__dirname+'/db/files.js');

	//wipe db shit
	await Promise.all([
		Captchas.deleteAll(),
		Accounts.deleteAll(),
		Posts.deleteAll(),
		Boards.deleteAll(),
		Bans.deleteAll(),
		Files.deleteAll()
	]);

	//add boards
	await Promise.all([
		//add test boards
		Boards.insertOne({
			'_id': 'test',
			'owner': '',
			'moderators': [],
			'banners': [],
			'sequence_value': 1,
			'settings': {
				'name': 'test',
				'description': 'testing board',
				'captchaMode': 0,
				'captchaTrigger': 10,
				'captchaTriggerMode': 2,
				'forceAnon': true,
				'ids': false,
				'userPostDelete': true,
				'userPostSpoiler': true,
				'userPostUnlink': true,
				'threadLimit': 200,
				'replyLimit': 500,
				'maxFiles': 0,
				'forceOPSubject': false,
				'forceOPMessage': true,
				'forceOPFile': false,
				'minMessageLength': 0,
				'defaultName': 'Anonymous',
				'announcement': {
					'raw':null,
					'markdown':null
				},
				'filters':[]
			}
		})
		//add indexes - should profiled and changed at some point if necessary
		, Bans.db.dropIndexes()
		, Captchas.captcha.dropIndexes()
		, Captchas.ratelimit.dropIndexes()
		, Posts.db.dropIndexes()
		, Files.db.createIndex({ 'count': 1 })
		, Bans.db.createIndex({ "expireAt": 1 }, { expireAfterSeconds: 0 }) //custom expiry, i.e. it will expire when current date > than this date
		, Captchas.captcha.createIndex({ "expireAt": 1 }, { expireAfterSeconds: 300 }) //captchas valid for 5 minutes
		, Captchas.ratelimit.createIndex({ "expireAt": 1 }, { expireAfterSeconds: 60 }) //per minute captcha ratelimit
		, Posts.db.createIndex({ 'postId': 1,'board': 1,})
		, Posts.db.createIndex({ 'board': 1,	'thread': 1, 'bumped': -1 })
		, Posts.db.createIndex({ 'board': 1, 'reports.0': 1 }, { 'partialFilterExpression': { 'reports.0': { '$exists': true } } })
		, Posts.db.createIndex({ 'globalreports.0': 1 }, { 'partialFilterExpression': {	'globalreports.0': { '$exists': true } } })
		//default admin acc
		, Accounts.insertOne('admin', 'changeme', 0)
	]);
	Mongo.client.close();

	//delete all the static files
	return Promise.all([
		del([ 'static/html/*' ]),
		del([ 'static/banner/*' ]),
		del([ 'static/captcha/*' ]),
		del([ 'static/img/*' ]),
		del([ 'static/css/*' ])
	]);
}

//update the css file
function css() {
	return gulp.src(paths.styles.src)
		.pipe(less())
		.pipe(cleanCSS())
		.pipe(gulp.dest(paths.styles.dest));
}

//favicon, spoiler/deleted image, default banner, spoiler/sticky/sage/cycle icons
function images() {
	return gulp.src(paths.images.src)
		.pipe(gulp.dest(paths.images.dest));
}

//TODO: pages here that users should edit built and output by pug e.g. homepage, FAQ, contact, privacy policy, tos, etc
async function html() {
	await del([ 'static/html/*' ]); //these will be now build-on-load
	return gulp.src(paths.pug.src)
		.pipe(pug())
		.pipe(gulp.dest(paths.pug.dest));
}

const build = gulp.parallel(css, images, html);
const reset = gulp.series(wipe, build)

module.exports = {
	html,
	css,
	images,
	reset,
	default: build,
};

