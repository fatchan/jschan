'use strict';

const gulp = require('gulp')
	, fs = require('fs-extra')
	, semver = require('semver')
	, formatSize = require(__dirname+'/helpers/files/formatsize.js')
	, uploadDirectory = require(__dirname+'/helpers/files/uploadDirectory.js')
	, configs = require(__dirname+'/configs/main.js')
	, { themes, codeThemes } = require(__dirname+'/helpers/themes.js')
	, commit = require(__dirname+'/helpers/commit.js')
	, less = require('gulp-less')
	, concat = require('gulp-concat')
	, cleanCSS = require('gulp-clean-css')
	, uglify = require('gulp-uglify-es').default
	, del = require('del')
	, pug = require('pug')
	, gulppug = require('gulp-pug')
	, { migrateVersion } = require(__dirname+'/package.json')
	, { randomBytes } = require('crypto')
	, paths = {
		styles: {
			src: 'gulp/res/css/',
			dest: 'static/css/'
		},
		images: {
			src: 'gulp/res/img/*',
			dest: 'static/file/'
		},
		icons: {
			src: 'gulp/res/icons/*',
			dest: 'static/file/'
		},
		scripts: {
			src: 'gulp/res/js',
			dest: 'static/js/'
		},
		pug: {
			src: 'views/',
			dest: 'static/html/'
		}
	};

async function wipe() {

	const Mongo = require(__dirname+'/db/db.js')
	const Redis = require(__dirname+'/redis.js')
	await Mongo.connect();
	const db = Mongo.db;

	//make these because mongo is dumb and doesnt make them automatically
	await db.createCollection('accounts');
	await db.createCollection('bans');
	await db.createCollection('boards');
	await db.createCollection('captcha');
	await db.createCollection('files');
	await db.createCollection('modlog');
	await db.createCollection('news');
	await db.createCollection('posts');
	await db.createCollection('poststats');
	await db.createCollection('ratelimit');
	await db.createCollection('webring');
	await db.createCollection('bypass');

	const { Webring, Boards, Posts, Captchas, Ratelimits, News,
		Accounts, Files, Stats, Modlogs, Bans, Bypass } = require(__dirname+'/db/');

	//wipe db shit
	await Promise.all([
		Redis.deletePattern('*'),
		Captchas.deleteAll(),
		Ratelimits.deleteAll(),
		Accounts.deleteAll(),
		Posts.deleteAll(),
		Boards.deleteAll(),
		Webring.deleteAll(),
		Bans.deleteAll(),
		Files.deleteAll(),
		Stats.deleteAll(),
		Modlogs.deleteAll(),
		Bypass.deleteAll(),
		News.deleteAll(),
	]);

	//add indexes - should profiled and changed at some point if necessary
	await Stats.db.createIndex({board:1, hour:1})
	await Boards.db.createIndex({ips: 1, pph:1, sequence_value:1})
	await Boards.db.createIndex({'settings.tags':1})
	await Boards.db.createIndex({lastPostTimestamp:1})
	await Webring.db.createIndex({uniqueUsers:1, postsPerHour:1, totalPosts:1})
	await Webring.db.createIndex({tags:1})
	await Webring.db.createIndex({lastPostTimestamp:1})
	await Bans.db.dropIndexes()
	await Captchas.db.dropIndexes()
	await Ratelimits.db.dropIndexes()
	await Posts.db.dropIndexes()
	await Modlogs.db.dropIndexes()
	await Modlogs.db.createIndex({ 'board': 1 })
	await Files.db.createIndex({ 'count': 1 })
	await Bans.db.createIndex({ 'ip.single': 1 , 'board': 1 })
	await Bans.db.createIndex({ 'expireAt': 1 }, { expireAfterSeconds: 0 }) //custom expiry, i.e. it will expire when current date > than this date
	await Bypass.db.createIndex({ 'expireAt': 1 }, { expireAfterSeconds: 0 })
	await Captchas.db.createIndex({ 'expireAt': 1 }, { expireAfterSeconds: 300 }) //captchas valid for 5 minutes
	await Ratelimits.db.createIndex({ 'expireAt': 1 }, { expireAfterSeconds: 60 }) //per minute captcha ratelimit
	await Posts.db.createIndex({ 'postId': 1,'board': 1,})
	await Posts.db.createIndex({ 'board': 1,	'thread': 1, 'bumped': -1 })
	await Posts.db.createIndex({ 'board': 1, 'reports.0': 1 }, { 'partialFilterExpression': { 'reports.0': { '$exists': true } } })
	await Posts.db.createIndex({ 'globalreports.0': 1 }, { 'partialFilterExpression': {	'globalreports.0': { '$exists': true } } })
	const randomPassword = randomBytes(20).toString('base64')
	await Accounts.insertOne('admin', 'admin', randomPassword, 0);
	console.log('\n\n=====LOGIN DETAILS=====\nusername: admin\npassword:', randomPassword, '\n=======================');

	await db.collection('version').replaceOne({
		'_id': 'version'
	}, {
		'_id': 'version',
		'version': migrateVersion
	}, {
		upsert: true
	});

	await Mongo.client.close();
	Redis.redisClient.quit();

	//delete all the static files
	return Promise.all([
		del([ 'static/html/*' ]),
		del([ 'static/json/*' ]),
		del([ 'static/banner/*' ]),
		del([ 'static/captcha/*' ]),
		del([ 'static/file/*' ]),
		del([ 'static/css/*' ]),
		fs.ensureDir(`${uploadDirectory}/captcha`),
	]);

}

//update the css file
async function css() {
	try {
		//a little more configurable
		let bypassHeight = configs.captchaOptions.type === 'google' ? 500
			: configs.captchaOptions.type === 'grid' ? 330
			: 235;
		let captchaHeight = configs.captchaOptions.type === 'text' ? 80
			: configs.captchaOptions.type === 'grid' ? configs.captchaOptions.grid.imageSize+30
			: 200; //'google' doesnt need this set
		let captchaWidth = configs.captchaOptions.type === 'text' ? 210
			: configs.captchaOptions.type === 'grid' ? configs.captchaOptions.grid.imageSize+30
			: 200; //'google' doesnt need this set
		const cssLocals = `:root {
    --attachment-img: url('/file/attachment.png');
    --spoiler-img: url('/file/spoiler.png');
    --audio-img: url('/file/audio.png');
    --thumbnail-size: ${configs.thumbSize}px;
    --captcha-w: ${captchaWidth}px;
    --captcha-h: ${captchaHeight}px;
    --bypass-height: ${bypassHeight}px;
}`;
		fs.writeFileSync('gulp/res/css/locals.css', cssLocals);
		fs.symlinkSync(__dirname+'/node_modules/highlight.js/styles', __dirname+'/gulp/res/css/codethemes', 'dir');
	} catch (e) {
		if (e.code !== 'EEXIST') {
			//already exists, ignore error
			console.log(e);
		}
	}
	await gulp.src([
			`${paths.styles.src}/themes/*.css`,
		])
		.pipe(less())
		.pipe(cleanCSS())
		.pipe(gulp.dest(`${paths.styles.dest}/themes/`));
	await gulp.src([
			`${paths.styles.src}/codethemes/*.css`,
		])
		.pipe(less())
		.pipe(cleanCSS())
		.pipe(gulp.dest(`${paths.styles.dest}/codethemes/`));
	await gulp.src([
			`${paths.styles.src}/locals.css`,
			`${paths.styles.src}/nscaptcha.css`,
		])
		.pipe(concat('nscaptcha.css'))
		.pipe(less())
		.pipe(cleanCSS())
		.pipe(gulp.dest(paths.styles.dest));
	return gulp.src([
			`${paths.styles.src}/locals.css`,
			`${paths.styles.src}/style.css`,
			`${paths.styles.src}/*.css`,
			`!${paths.styles.src}/nscaptcha.css`,
		])
		.pipe(concat('style.css'))
		.pipe(less())
		.pipe(cleanCSS())
		.pipe(gulp.dest(paths.styles.dest));
}

//spoiler/deleted image, default banner, spoiler/sticky/sage/cycle icons
function images() {
	return gulp.src(paths.images.src)
		.pipe(gulp.dest(paths.images.dest));
}

//favicon/safari/chrome/mstiles, etc
function icons() {
	return gulp.src(paths.icons.src)
		.pipe(gulp.dest(paths.icons.dest));
}

async function cache() {
	const Redis = require(__dirname+'/redis.js')
	await Promise.all([
		Redis.deletePattern('boards:listed'),
		Redis.deletePattern('board:*'),
		Redis.deletePattern('banners:*'),
		Redis.deletePattern('users:*'),
		Redis.deletePattern('blacklisted:*'),
	]);
	Redis.redisClient.quit();
}

function deletehtml() {
	return del([ 'static/html/*' ]);
}

function custompages() {
	return gulp.src([
		`${paths.pug.src}/custompages/*.pug`,
		`${paths.pug.src}/pages/404.pug`,
		`${paths.pug.src}/pages/500.pug`,
		`${paths.pug.src}/pages/502.pug`,
		`${paths.pug.src}/pages/503.pug`,
		`${paths.pug.src}/pages/504.pug`
	])
	.pipe(gulppug({
		locals: {
			meta: configs.meta,
			enableWebring: configs.enableWebring,
			globalLimits: configs.globalLimits,
			codeLanguages: configs.highlightOptions.languageSubset,
			defaultTheme: configs.boardDefaults.theme,
			defaultCodeTheme: configs.boardDefaults.codeTheme,
			postFilesSize: formatSize(configs.globalLimits.postFilesSize.max),
			captchaType: configs.captchaOptions.type,
			googleRecaptchaSiteKey: configs.captchaOptions.google.siteKey,
			captchaGridSize: configs.captchaOptions.grid.size,
			commit,
		}
	}))
	.pipe(gulp.dest(paths.pug.dest));
}

function scripts() {
	try {
		const locals = `const themes = ['${themes.join("', '")}'];
const codeThemes = ['${codeThemes.join("', '")}'];
const captchaType = '${configs.captchaOptions.type}';
const captchaGridSize = ${configs.captchaOptions.grid.size};
const SERVER_TIMEZONE = '${Intl.DateTimeFormat().resolvedOptions().timeZone}';
const settings = ${JSON.stringify(configs.frontendScriptDefault)};
`;
		fs.writeFileSync('gulp/res/js/locals.js', locals);
		fs.writeFileSync('gulp/res/js/post.js', pug.compileFileClient(`${paths.pug.src}/includes/post.pug`, { compileDebug: false, debug: false, name: 'post' }));
		fs.writeFileSync('gulp/res/js/modal.js', pug.compileFileClient(`${paths.pug.src}/includes/modal.pug`, { compileDebug: false, debug: false, name: 'modal' }));
		fs.writeFileSync('gulp/res/js/uploaditem.js', pug.compileFileClient(`${paths.pug.src}/includes/uploaditem.pug`, { compileDebug: false, debug: false, name: 'uploaditem' }));
		fs.writeFileSync('gulp/res/js/pugfilters.js', pug.compileFileClient(`${paths.pug.src}/includes/filters.pug`, { compileDebug: false, debug: false, name: 'filters' }));
		fs.writeFileSync('gulp/res/js/captchaformsection.js', pug.compileFileClient(`${paths.pug.src}/includes/captchaformsection.pug`, { compileDebug: false, debug: false, name: 'captchaformsection' }));
		fs.symlinkSync(__dirname+'/node_modules/socket.io-client/dist/socket.io.slim.js', __dirname+'/gulp/res/js/socket.io.js', 'file');
	} catch (e) {
		if (e.code !== 'EEXIST') {
			console.log(e);
		}
	}
	gulp.src([
			//put scripts in order for dependencies
			`${paths.scripts.src}/locals.js`,
			`${paths.scripts.src}/localstorage.js`,
			`${paths.scripts.src}/modal.js`,
			`${paths.scripts.src}/pugfilters.js`,
			`${paths.scripts.src}/post.js`,
			`${paths.scripts.src}/settings.js`,
			`${paths.scripts.src}/live.js`,
			`${paths.scripts.src}/captcha.js`,
			`${paths.scripts.src}/forms.js`,
			`${paths.scripts.src}/*.js`,
			`!${paths.scripts.src}/hidefileinput.js`,
			`!${paths.scripts.src}/dragable.js`,
			`!${paths.scripts.src}/filters.js`,
			`!${paths.scripts.src}/yous.js`,
			`!${paths.scripts.src}/catalog.js`,
			`!${paths.scripts.src}/time.js`,
			`!${paths.scripts.src}/themelist.js`, //dont include files from my fuck up with git. todo: make this a migration?
			`!${paths.scripts.src}/timezone.js`,
		])
		.pipe(concat('all.js'))
		.pipe(uglify({compress:false}))
		.pipe(gulp.dest(paths.scripts.dest));
	return gulp.src([
			`${paths.scripts.src}/hidefileinput.js`,
			`${paths.scripts.src}/dragable.js`,
			`${paths.scripts.src}/yous.js`,
			`${paths.scripts.src}/filters.js`,
			`${paths.scripts.src}/catalog.js`,
			`${paths.scripts.src}/time.js`,
		])
		.pipe(concat('render.js'))
		.pipe(uglify({compress:false}))
		.pipe(gulp.dest(paths.scripts.dest));
}

async function migrate() {

	const Mongo = require(__dirname+'/db/db.js')
	const Redis = require(__dirname+'/redis.js')
	await Mongo.connect();
	const db = Mongo.db;

	//get current version from db if present (set in 'reset' task in recent versions)
	let currentVersion = await db.collection('version').findOne({
		'_id': 'version'
	}).then(res => res ? res.version : '0.0.0'); // 0.0.0 for old versions

	if (semver.lt(currentVersion, migrateVersion)) {
		console.log(`Current version: ${currentVersion}`);
		const migrations = require(__dirname+'/migrations/');
		const migrationVersions = Object.keys(migrations)
			.sort(semver.compare)
			.filter(v => semver.gt(v, currentVersion));
		console.log(`Migrations needed: ${currentVersion} -> ${migrationVersions.join(' -> ')}`);
		for (let ver of migrationVersions) {
			console.log(`=====\nStarting migration to version ${ver}`);
			try {
				await migrations[ver](db, Redis);
				await db.collection('version').replaceOne({
					'_id': 'version'
				}, {
					'_id': 'version',
					'version': ver
				}, {
					upsert: true
				});
			} catch (e) {
				console.error(e);
				console.warn(`Migration to ${ver} encountered an error`);
			}
			console.log(`Finished migrating to version ${ver}`);
		}
	} else {
		console.log(`Migration not required, you are already on the current version (${migrateVersion})`)
	}

	await Mongo.client.close();
	Redis.redisClient.quit();

}

const build = gulp.parallel(gulp.series(scripts, css), images, icons, gulp.series(deletehtml, custompages));
const reset = gulp.series(wipe, build);
const html = gulp.series(deletehtml, custompages);

module.exports = {
	html,
	css,
	images,
	icons,
	reset,
	custompages,
	scripts,
	wipe,
	cache,
	migrate,
	default: build,
};
