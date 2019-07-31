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
		, Accounts = require(__dirname+'/db/accounts.js');
		, Files = require(__dirname+'/db/files.js');

	//wipe db shit
	await Captchas.deleteAll();
	await Accounts.deleteAll();
	await Posts.deleteAll();
	await Boards.deleteAll();
	await Bans.deleteAll();
	await Files.deleteAll();

	//add boards
	await Boards.insertOne({
		_id: 'file',
		owner: '',
		moderators: [],
		banners: [],
		sequence_value: 1,
		settings: {
			name: 'file',
			description: 'testing new file types',
			captchaTrigger: 10,
			captcha: false,
			forceAnon: false,
			ids: false,
			userPostDelete: true,
			userPostSpoiler: true,
			userPostUnlink: true,
			threadLimit: 200,
			replyLimit: 500,
			maxFiles: 3,
			forceOPSubject: false,
			forceOPMessage: true,
			forceOPFile: true,
			minMessageLength: 0,
			defaultName: 'Anonymous',
		}
	})
	await Boards.insertOne({
		_id: 'pol',
		owner: '',
		moderators: [],
		banners: [],
		sequence_value: 1,
		settings: {
			name: 'politics',
			description: 'talk about politics',
			captchaTrigger: 10,
			captcha: false,
			forceAnon: true,
			ids: true,
			userPostDelete: true,
			userPostSpoiler: true,
			userPostUnlink: true,
			threadLimit: 200,
			replyLimit: 500,
			maxFiles: 3,
			forceOPSubject: true,
			forceOPMessage: true,
			forceOPFile: true,
			minMessageLength: 0,
			defaultName: 'Anonymous',
		}
	})
	await Boards.insertOne({
		_id: 'b',
		owner: '',
		moderators: [],
		banners: [],
		sequence_value: 1,
		settings: {
			name: 'random',
			description: 'anything and everything',
			captchaTrigger: 10,
			captcha: false,
			forceAnon: false,
			ids: false,
			userPostDelete: true,
			userPostSpoiler: true,
			userPostUnlink: true,
			threadLimit: 200,
			replyLimit: 500,
			maxFiles: 3,
			forceOPSubject: false,
			forceOPMessage: true,
			forceOPFile: true,
			minMessageLength: 0,
			defaultName: 'Anonymous',
		}
	})
	await Boards.insertOne({
		_id: 't',
		owner: '',
		moderators: [],
		banners: [],
		sequence_value: 1,
		settings: {
			name: 'test',
			description: 'testing board',
			captchaTrigger: 10,
			captcha: false,
			forceAnon: true,
			ids: false,
			userPostDelete: true,
			userPostSpoiler: true,
			userPostUnlink: true,
			threadLimit: 200,
			replyLimit: 500,
			maxFiles: 0,
			forceOPSubject: false,
			forceOPMessage: true,
			forceOPFile: false,
			minMessageLength: 0,
			defaultName: 'Anonymous',
		}
	})

	//add indexes - should profiled and changed at some point if necessary
	await Bans.db.dropIndexes();
	await Captchas.captcha.dropIndexes();
	await Captchas.ratelimit.dropIndexes();
	await Posts.db.dropIndexes();

	await Files.db.createIndex({ 'count': 1 })
	await Bans.db.createIndex({ "expireAt": 1 }, { expireAfterSeconds: 0 }); //custom expiry, i.e. it will expire when current date > than this date
	await Captchas.captcha.createIndex({ "expireAt": 1 }, { expireAfterSeconds: 300 }); //captchas valid for 5 minutes
	await Captchas.ratelimit.createIndex({ "expireAt": 1 }, { expireAfterSeconds: 60 }); //per minute captcha ratelimit
	await Posts.db.createIndex({
		'postId': 1,
		'board': 1,
	});
	await Posts.db.createIndex({
		'board': 1,
		'thread': 1,
		'bumped': -1
	});
	await Posts.db.createIndex({
		'board': 1,
		'reports.0': 1
	}, {
		partialFilterExpression: {
			'reports.0': {
				'$exists': true
			}
		}
	});
	await Posts.db.createIndex({
		'globalreports.0': 1
	}, {
		partialFilterExpression: {
			'globalreports.0': {
				'$exists': true
			}
		}
	});

	//default admin acc
	await Accounts.insertOne('admin', 'changeme', 0);
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

