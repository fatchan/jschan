'use strict';

const gulp = require('gulp')
	, configs = require(__dirname+'/configs/main.json')
	, themes = require(__dirname+'/helpers/themes.js')
	, less = require('gulp-less')
	, concat = require('gulp-concat')
	, cleanCSS = require('gulp-clean-css')
	, uglify = require('gulp-uglify-es').default
	, del = require('del')
	, pug = require('pug')
	, gulppug = require('gulp-pug')
	, paths = {
		styles: {
			src: 'gulp/res/css/**/*',
			dest: 'static/css/'
		},
		images: {
			src: 'gulp/res/img/*',
			dest: 'static/img/'
		},
		scripts: {
			src: 'gulp/res/js/*.js',
			dest: 'static/js/'
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
		, Ratelimits = require(__dirname+'/db/ratelimits.js')
		, Accounts = require(__dirname+'/db/accounts.js')
		, Files = require(__dirname+'/db/files.js')
		, Stats = require(__dirname+'/db/stats.js');

	//wipe db shit
	await Promise.all([
		Captchas.deleteAll(),
		Ratelimits.deleteAll(),
		Accounts.deleteAll(),
		Posts.deleteAll(),
		Boards.deleteAll(),
		Bans.deleteAll(),
		Files.deleteAll(),
		Stats.deleteAll()
	]);

	//add boards
	await Promise.all([
		//add test boards
		Boards.insertOne({
			'_id': 'test',
			'owner': '',
			'banners': [],
			'pph': 0,
			'ips': 0,
			'sequence_value': 1,
			'settings': {
				'name': 'test',
				'description': 'testing board',
				'tags': [],
				'moderators': [],
				...configs.boardDefaults
			}
		})
		//add indexes - should profiled and changed at some point if necessary
		, Stats.db.createIndex({board:1, hour:1})
		, Boards.db.createIndex({ips: 1, pph:1, sequence_value:1})
		, Bans.db.dropIndexes()
		, Captchas.db.dropIndexes()
		, Ratelimits.db.dropIndexes()
		, Posts.db.dropIndexes()
		, Modlogs.db.dropIndexes()
		, Modlogs.db.createIndex({ 'board': 1 })
		, Files.db.createIndex({ 'count': 1 })
		, Bans.db.createIndex({ 'ip': 1 , 'board': 1 })
		, Bans.db.createIndex({ "expireAt": 1 }, { expireAfterSeconds: 0 }) //custom expiry, i.e. it will expire when current date > than this date
		, Captchas.db.createIndex({ "expireAt": 1 }, { expireAfterSeconds: 300 }) //captchas valid for 5 minutes
		, Ratelimits.db.createIndex({ "expireAt": 1 }, { expireAfterSeconds: 60 }) //per minute captcha ratelimit
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
		del([ 'static/json/*' ]),
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

function deletehtml() {
	return Promise.all([
		del([ 'static/html/*' ]),
		del([ 'static/json/*' ])
	]);
}

function custompages() {
	return gulp.src(paths.pug.src)
		.pipe(gulppug({
			locals: {
				themes,
				defaultTheme: configs.boardDefaults.theme
			}
		}))
		.pipe(gulp.dest(paths.pug.dest));
}

function scripts() {
	//function for templating a post from data i.e. from API used to build posts on site with scripts that match templates
	const compiledFunction = pug.compileFileClient('views/includes/post.pug', { compileDebug: false, debug: false, name: 'post' });
	require('fs').writeFileSync('gulp/res/js/post.js', compiledFunction);
	gulp.src(paths.scripts.src)
		.pipe(concat('all.js'))
//		.pipe(uglify())
		.pipe(gulp.dest(paths.scripts.dest));
	return gulp.src(paths.scripts.src)
		.pipe(uglify())
		.pipe(gulp.dest(paths.scripts.dest));
}

const build = gulp.parallel(css, scripts, images, deletehtml, custompages);
const reset = gulp.series(wipe, build)
const html = gulp.series(deletehtml, custompages)

module.exports = {
	html,
	css,
	images,
	reset,
	custompages,
	scripts,
	default: build,
};
