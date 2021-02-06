'use strict';

const config = require(__dirname+'/config.js')
	, { hcaptcha, google } = require(__dirname+'/configs/secrets.js')
	, gulp = require('gulp')
	, fs = require('fs-extra')
	, semver = require('semver')
	, uploadDirectory = require(__dirname+'/helpers/files/uploadDirectory.js')
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
	, Redis = require(__dirname+'/redis.js')
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


async function password() {

	const Mongo = require(__dirname+'/db/db.js')
	const Redis = require(__dirname+'/redis.js')
	await Mongo.connect();

	const { Accounts } = require(__dirname+'/db/');

	const randomPassword = randomBytes(20).toString('base64')
	await Accounts.changePassword('admin', randomPassword);
	console.log('=====LOGIN DETAILS=====\nusername: admin\npassword:', randomPassword, '\n=======================');

	Redis.close();
	return Mongo.client.close();

}

async function ips() {
	const Mongo = require(__dirname+'/db/db.js')
	await Mongo.connect();
	const Redis = require(__dirname+'/redis.js')
	const { func: ipSchedule } = require(__dirname+'/schedules/tasks/ips.js');
	await ipSchedule();
	Redis.close();
	return Mongo.client.close();
}

async function wipe() {

	const Mongo = require(__dirname+'/db/db.js')
	const Redis = require(__dirname+'/redis.js')
	await Mongo.connect();
	const db = Mongo.db;

	const collectionNames = ['accounts', 'bans', 'custompages', 'boards', 'captcha', 'files',
		'modlog','news', 'posts', 'poststats', 'ratelimit', 'webring', 'bypass'];
	for (const name of collectionNames) {
		//drop collection so gulp reset can be run again. ignores error of dropping non existing collection first time
		await db.dropCollection(name).catch(e => {});
		await db.createCollection(name);
	}

	const { Webring, Boards, Posts, Captchas, Ratelimits, News, CustomPages,
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
	await CustomPages.db.dropIndexes()
	await CustomPages.db.createIndex({ 'board': 1, 'page': 1 }, { unique: true })
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
	console.log('=====LOGIN DETAILS=====\nusername: admin\npassword:', randomPassword, '\n=======================');

	await db.collection('version').replaceOne({
		'_id': 'version'
	}, {
		'_id': 'version',
		'version': migrateVersion
	}, {
		upsert: true
	});

	await Mongo.client.close();
	Redis.close();

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
	await config.load();
	try {
		//a little more configurable
		let bypassHeight = (config.get.captchaOptions.type === 'google' || config.get.captchaOptions.type === 'hcaptcha')
			? 500
			: config.get.captchaOptions.type === 'grid'
				? 330
				: 235;
		let captchaHeight = config.get.captchaOptions.type === 'text' ? 80
			: config.get.captchaOptions.type === 'grid' ? config.get.captchaOptions.grid.imageSize+30
			: 200; //google/hcaptcha doesnt need this set
		let captchaWidth = config.get.captchaOptions.type === 'text' ? 210
			: config.get.captchaOptions.type === 'grid' ? config.get.captchaOptions.grid.imageSize+30
			: 200; //google/hcaptcha doesnt need this set
		const cssLocals = `:root {
    --attachment-img: url('/file/attachment.png');
    --spoiler-img: url('/file/spoiler.png');
    --audio-img: url('/file/audio.png');
    --thumbnail-size: ${config.get.thumbSize}px;
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
		Redis.deletePattern('boardlist:*'),
		Redis.deletePattern('banners:*'),
		Redis.deletePattern('users:*'),
		Redis.deletePattern('blacklisted:*'),
		Redis.deletePattern('overboard'),
		Redis.deletePattern('catalog'),
	]);
	Redis.close();
}

function deletehtml() {
	return del([ 'static/html/*' ]);
}

async function custompages() {
	await config.load();
	const formatSize = require(__dirname+'/helpers/files/formatsize.js');
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
			early404Fraction: config.get.early404Fraction,
			early404Replies: config.get.early404Replies,
			meta: config.get.meta,
			enableWebring: config.get.enableWebring,
			globalLimits: config.get.globalLimits,
			codeLanguages: config.get.highlightOptions.languageSubset,
			defaultTheme: config.get.boardDefaults.theme,
			defaultCodeTheme: config.get.boardDefaults.codeTheme,
			postFilesSize: formatSize(config.get.globalLimits.postFilesSize.max),
			captchaType: config.get.captchaOptions.type,
			googleRecaptchaSiteKey: google.siteKey,
			hcaptchaSitekey: hcaptcha.siteKey,
			captchaGridSize: config.get.captchaOptions.grid.size,
			commit,
		}
	}))
	.pipe(gulp.dest(paths.pug.dest));
}

async function scripts() {
	await config.load();
	const { themes, codeThemes } = require(__dirname+'/helpers/themes.js');
	try {
		const locals = `const themes = ['${themes.join("', '")}'];
const codeThemes = ['${codeThemes.join("', '")}'];
const captchaType = '${config.get.captchaOptions.type}';
const captchaGridSize = ${config.get.captchaOptions.grid.size};
const SERVER_TIMEZONE = '${Intl.DateTimeFormat().resolvedOptions().timeZone}';
const ipHashPermLevel = ${config.get.ipHashPermLevel};
const settings = ${JSON.stringify(config.get.frontendScriptDefault)};
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
			`!${paths.scripts.src}/hideimages.js`,
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
			`${paths.scripts.src}/hideimages.js`,
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
	Redis.close();

}

async function closeRedis() {
	Redis.close();
}

const build = gulp.series(gulp.parallel(gulp.series(scripts, css), images, icons, gulp.series(deletehtml, custompages)), closeRedis);
const reset = gulp.series(wipe, build, closeRedis);
const html = gulp.series(deletehtml, custompages, closeRedis);

module.exports = {
	html,
	css: gulp.series(css, closeRedis),
	images,
	icons,
	reset,
	custompages: gulp.series(custompages, closeRedis),
	scripts: gulp.series(scripts, closeRedis),
	wipe,
	cache,
	migrate,
	password,
	ips,
	default: build,
};
