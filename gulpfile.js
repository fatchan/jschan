'use strict';

const config = require(__dirname+'/lib/misc/config.js')
	, { Binary } = require('mongodb')
	, Permission = require(__dirname+'/lib/permission/permission.js')
	, { Permissions } = require(__dirname+'/lib/permission/permissions.js')
	, { hcaptcha, google } = require(__dirname+'/configs/secrets.js')
	, gulp = require('gulp')
//	, pugRuntime = require('pug-runtime/build')
	, fs = require('fs-extra')
	, semver = require('semver')
	, uploadDirectory = require(__dirname+'/lib/file/uploaddirectory.js')
	, commit = require(__dirname+'/lib/misc/commit.js')
	, replace = require('gulp-replace')
	, less = require('gulp-less')
	, concat = require('gulp-concat')
	, cleanCSS = require('gulp-clean-css')
	, uglify = require('gulp-uglify-es').default
	, realFavicon = require('gulp-real-favicon')
	, del = require('del')
	, pug = require('pug')
	, gulppug = require('gulp-pug')
	, { migrateVersion, version } = require(__dirname+'/package.json')
	, { randomBytes } = require('crypto')
	, Redis = require(__dirname+'/lib/redis/redis.js')
	, Mongo = require(__dirname+'/db/db.js')
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

// File where the favicon markups are stored
var FAVICON_DATA_FILE = 'gulp/res/icons/faviconData.json';

// Generate the icons. This task takes a few seconds to complete.
// You should run it at least once to create the icons. Then,
// you should run it whenever RealFaviconGenerator updates its
// package (see the check-for-favicon-update task below).
gulp.task('generate-favicon', function(done) {
	realFavicon.generateFavicon({
		masterPicture: 'gulp/res/icons/master.png',
		dest: 'gulp/res/icons',
		iconsPath: '/file',
		design: {
			ios: {
				pictureAspect: 'backgroundAndMargin',
				backgroundColor: '#ffffff',
				margin: '14%',
				assets: {
					ios6AndPriorIcons: false,
					ios7AndLaterIcons: false,
					precomposedIcons: false,
					declareOnlyDefaultIcon: true
				}
			},
			desktopBrowser: {
				design: 'raw'
			},
			windows: {
				pictureAspect: 'whiteSilhouette',
				backgroundColor: '#da532c',
				onConflict: 'override',
				assets: {
					windows80Ie10Tile: false,
					windows10Ie11EdgeTiles: {
						small: false,
						medium: true,
						big: false,
						rectangle: false
					}
				}
			},
			androidChrome: {
				pictureAspect: 'shadow',
				themeColor: '#ffffff',
				manifest: {
					display: 'standalone',
					orientation: 'notSet',
					onConflict: 'override',
					declared: true
				},
				assets: {
					legacyIcon: false,
					lowResolutionIcons: false
				}
			},
			safariPinnedTab: {
				pictureAspect: 'blackAndWhite',
				threshold: 30,
				themeColor: '#990000'
			}
		},
		settings: {
			scalingAlgorithm: 'Lanczos',
			errorOnImageTooSmall: false,
			readmeFile: false,
			htmlCodeFile: true,
			usePathAsIs: false
		},
		versioning: {
			paramName: 'v',
			paramValue: commit
		},
		markupFile: FAVICON_DATA_FILE
	}, function() {
		done();
	});
});

// Check for updates on RealFaviconGenerator (think: Apple has just
// released a new Touch icon along with the latest version of iOS).
// Run this task from time to time. Ideally, make it part of your
// continuous integration system.
gulp.task('check-for-favicon-update', function(done) {
	var currentVersion = JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).version;
	realFavicon.checkForUpdates(currentVersion, function(err) {
		if (err) {
			throw err;
		}
		done();
	});
});

async function password() {
	const { Accounts } = require(__dirname+'/db/');
	const randomPassword = randomBytes(20).toString('base64');
	await Accounts.changePassword('admin', randomPassword);
	const ROOT = new Permission();
	ROOT.setAll(Permission.allPermissions);
	await Accounts.setAccountPermissions('admin', ROOT);
	console.log('=====LOGIN DETAILS=====\nusername: admin\npassword:', randomPassword, '\n=======================');
}

async function ips() {
	const { func: ipSchedule } = require(__dirname+'/schedules/tasks/ips.js');
	await ipSchedule();
}

async function wipe() {
	const db = Mongo.db;

	const defaultConfig = require(__dirname+'/configs/template.js.example');
	await Mongo.setConfig(defaultConfig);

	const collectionNames = ['accounts', 'bans', 'custompages', 'boards', 'captcha', 'files',
		'modlog','news', 'posts', 'poststats', 'ratelimit', 'bypass', 'roles'];
	for (const name of collectionNames) {
		//drop collection so gulp reset can be run again. ignores error of dropping non existing collection first time
		await db.dropCollection(name).catch(() => {});
		await db.createCollection(name);
	}

	const { Boards, Posts, Captchas, Ratelimits, News, CustomPages,
		Accounts, Files, Stats, Modlogs, Bans, Bypass, Roles } = require(__dirname+'/db/');

	//wipe db shit
	await Promise.all([
		Redis.deletePattern('*'),
		Captchas.deleteAll(),
		Ratelimits.deleteAll(),
		Accounts.deleteAll(),
		Roles.deleteAll(),
		Posts.deleteAll(),
		Boards.deleteAll(),
		Bans.deleteAll(),
		Files.deleteAll(),
		Stats.deleteAll(),
		Modlogs.deleteAll(),
		Bypass.deleteAll(),
		News.deleteAll(),
	]);

	//add indexes - should profiled and changed at some point if necessary
	await Stats.db.createIndex({board:1, hour:1});
	await Boards.db.createIndex({ips: 1, pph:1, sequence_value:1});
	await Boards.db.createIndex({tags: 1});
	await Boards.db.createIndex({uri: 1});
	await Boards.db.createIndex({lastPostTimestamp:1});
	await Roles.db.dropIndexes();
	await Bans.db.dropIndexes();
	await Captchas.db.dropIndexes();
	await Ratelimits.db.dropIndexes();
	await Posts.db.dropIndexes();
	await Modlogs.db.dropIndexes();
	await CustomPages.db.dropIndexes();
	await CustomPages.db.createIndex({ 'board': 1, 'page': 1 }, { unique: true });
	await Roles.db.createIndex({ 'permissions': 1 }, { unique: true });
	await Modlogs.db.createIndex({ 'board': 1 });
	await Files.db.createIndex({ 'count': 1 });
	await Bans.db.createIndex({ 'ip.cloak': 1 , 'board': 1 });
	await Bans.db.createIndex({ 'expireAt': 1 }, { expireAfterSeconds: 0 }); //custom expiry, i.e. it will expire when current date > than this date
	await Bypass.db.createIndex({ 'expireAt': 1 }, { expireAfterSeconds: 0 });
	await Captchas.db.createIndex({ 'expireAt': 1 }, { expireAfterSeconds: 300 }); //captchas valid for 5 minutes
	await Ratelimits.db.createIndex({ 'expireAt': 1 }, { expireAfterSeconds: 60 }); //per minute captcha ratelimit
	await Posts.db.createIndex({ 'postId': 1,'board': 1,});
	await Posts.db.createIndex({ 'board': 1,	'thread': 1, 'bumped': -1 });
	await Posts.db.createIndex({ 'board': 1, 'reports.0': 1 }, { 'partialFilterExpression': { 'reports.0': { '$exists': true } } });
	await Posts.db.createIndex({ 'globalreports.0': 1 }, { 'partialFilterExpression': {	'globalreports.0': { '$exists': true } } });

	const ANON = new Permission();
	ANON.setAll([
		Permissions.USE_MARKDOWN_PINKTEXT, Permissions.USE_MARKDOWN_GREENTEXT, Permissions.USE_MARKDOWN_BOLD, 
		Permissions.USE_MARKDOWN_UNDERLINE, Permissions.USE_MARKDOWN_STRIKETHROUGH, Permissions.USE_MARKDOWN_TITLE, 
		Permissions.USE_MARKDOWN_ITALIC, Permissions.USE_MARKDOWN_SPOILER, Permissions.USE_MARKDOWN_MONO, 
		Permissions.USE_MARKDOWN_CODE, Permissions.USE_MARKDOWN_DETECTED, Permissions.USE_MARKDOWN_LINK, 
		Permissions.USE_MARKDOWN_DICE, Permissions.USE_MARKDOWN_FORTUNE, Permissions.CREATE_BOARD, 
		Permissions.CREATE_ACCOUNT
	]);
	const BOARD_STAFF = new Permission(ANON.base64);
	BOARD_STAFF.setAll([
		Permissions.MANAGE_BOARD_GENERAL, Permissions.MANAGE_BOARD_BANS, Permissions.MANAGE_BOARD_LOGS, 
	]);
	const BOARD_OWNER = new Permission(BOARD_STAFF.base64);
	BOARD_OWNER.setAll([
		Permissions.MANAGE_BOARD_OWNER, Permissions.MANAGE_BOARD_STAFF, Permissions.MANAGE_BOARD_CUSTOMISATION, 
		Permissions.MANAGE_BOARD_SETTINGS,
	]);
	const GLOBAL_STAFF = new Permission(BOARD_OWNER.base64);
	GLOBAL_STAFF.setAll([
		Permissions.MANAGE_GLOBAL_GENERAL, Permissions.MANAGE_GLOBAL_BANS, Permissions.MANAGE_GLOBAL_LOGS, Permissions.MANAGE_GLOBAL_NEWS, 
		Permissions.MANAGE_GLOBAL_BOARDS, Permissions.MANAGE_GLOBAL_SETTINGS, Permissions.MANAGE_BOARD_OWNER, Permissions.BYPASS_FILTERS, 
		Permissions.BYPASS_BANS, Permissions.BYPASS_SPAMCHECK, Permissions.BYPASS_RATELIMITS,
	]);
	const ADMIN = new Permission(GLOBAL_STAFF.base64);
	ADMIN.setAll([
		Permissions.MANAGE_GLOBAL_ACCOUNTS, Permissions.MANAGE_GLOBAL_ROLES, Permissions.VIEW_RAW_IP, 
	]);
	const ROOT = new Permission();
	ROOT.setAll(Permission.allPermissions);
	await Roles.db.insertMany([
		{ name: 'ANON', permissions: Binary(ANON.array) },
		{ name: 'BOARD_STAFF', permissions: Binary(BOARD_STAFF.array) },
		{ name: 'BOARD_OWNER', permissions: Binary(BOARD_OWNER.array) },
		{ name: 'GLOBAL_STAFF', permissions: Binary(GLOBAL_STAFF.array) },
		{ name: 'ADMIN', permissions: Binary(ADMIN.array) },
		{ name: 'ROOT', permissions: Binary(ROOT.array) },
	]);

	const randomPassword = randomBytes(20).toString('base64');
	await Accounts.insertOne('admin', 'admin', randomPassword, ROOT);
	console.log('=====LOGIN DETAILS=====\nusername: admin\npassword:', randomPassword, '\n=======================');

	await db.collection('version').replaceOne({
		'_id': 'version'
	}, {
		'_id': 'version',
		'version': migrateVersion
	}, {
		upsert: true
	});

	await Promise.all([
		del([ 'static/file/*' ]),
		del([ 'static/captcha/*' ]),
		del([ 'static/html/*' ]),
		del([ 'static/json/*' ]),
		del([ 'static/banner/*' ]),
		del([ 'static/flag/*' ]),
		del([ 'static/asset/*' ]),
		del([ 'static/css/*' ]),
	]);

	return Promise.all([
		fs.ensureDir(`${uploadDirectory}/captcha`),
		fs.ensureDir(`${uploadDirectory}/file/thumb`),
	]);

}

//update the css file
async function css() {
	try {
		//a little more configurable
		let bypassHeight
			, captchaHeight
			, captchaWidth;
		switch (config.get.captchaOptions.type) {
			case 'google':
			case 'hcaptcha':
				bypassHeight = 500;
				captchaHeight = 200;
				captchaWidth = 200;
				break;
			case 'grid':
			case 'grid2':
				bypassHeight = 330;
				captchaHeight = config.get.captchaOptions.grid.imageSize+30;
				captchaWidth = config.get.captchaOptions.grid.imageSize+30;
				break;
			case 'text':
				bypassHeight = 235;
				captchaHeight = 80;
				captchaWidth = 210;
				break;
		}
		const cssLocals = `:root {
    --attachment-img: url('/file/attachment.png');
    --spoiler-img: url('/file/spoiler.png');
    --audio-img: url('/file/audio.png');
    --captcha-grid-size: ${'1fr '.repeat(config.get.captchaOptions.grid.size)};
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
	//move themes css to output folder
	await gulp.src([
		`${paths.styles.src}/themes/*.css`,
	])
		.pipe(less())
		.pipe(cleanCSS())
		.pipe(gulp.dest(`${paths.styles.dest}/themes/`));
	//replace url( in codethemes to correct basepath of images, and move to output folder
	await gulp.src([
		`${paths.styles.src}/codethemes/*.css`,
	])
		.pipe(replace('url(./', 'url(/css/codethemes/assets/'))
		.pipe(less())
		.pipe(cleanCSS())
		.pipe(gulp.dest(`${paths.styles.dest}/codethemes/`));

	//move assets for code codethemes/assets folder
	await gulp.src([
		`${paths.styles.src}/codethemes/*`,
		`!${paths.styles.src}/codethemes/*.css`,
	])
		.pipe(gulp.dest(`${paths.styles.dest}/codethemes/assets/`));
	//move assets for themes to theme/assets folder
	await gulp.src([
		`${paths.styles.src}/themes/assets/*`,
	])
		.pipe(gulp.dest(`${paths.styles.dest}/themes/assets/`));

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
		`${paths.styles.src}/tegaki.css`, //make sure any custom.css also goes after this
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
	await Promise.all([
		Redis.deletePattern('boards:listed'),
		Redis.deletePattern('board:*'),
		Redis.deletePattern('boardlist:*'),
		Redis.deletePattern('banners:*'),
		Redis.deletePattern('users:*'),
		Redis.deletePattern('blacklisted:*'),
		Redis.deletePattern('overboard:*'),
		Redis.deletePattern('catalog:*'),
		Redis.deletePattern('webringsites'),
	]);
}

function deletehtml() {
	return del([ 'static/html/*' ]);
}

async function custompages() {
	const formatSize = require(__dirname+'/lib/converter/formatsize.js')
		, i18n = require(__dirname+'/lib/locale/locale.js')
		, locals = {
			Permissions,
			early404Fraction: config.get.early404Fraction,
			early404Replies: config.get.early404Replies,
			meta: config.get.meta,
			archiveLinksURL: config.get.archiveLinksURL,
			reverseImageLinksURL: config.get.reverseImageLinksURL,
			enableWebring: config.get.enableWebring,
			globalLimits: config.get.globalLimits,
			codeLanguages: config.get.highlightOptions.languageSubset,
			defaultTheme: config.get.boardDefaults.theme,
			defaultCodeTheme: config.get.boardDefaults.codeTheme,
			postFilesSize: formatSize(config.get.globalLimits.postFilesSize.max),
			googleRecaptchaSiteKey: google.siteKey,
			hcaptchaSiteKey: hcaptcha.siteKey,
			globalAnnouncement: config.get.globalAnnouncement,
			captchaOptions: config.get.captchaOptions,
			commit,
			version,
			globalLanguage: config.get.language,
		};
	i18n.init(locals);
	locals.setLocale(locals, config.get.language);
	return gulp.src([
		`${paths.pug.src}/custompages/*.pug`,
		`${paths.pug.src}/pages/404.pug`,
		`${paths.pug.src}/pages/500.pug`,
		`${paths.pug.src}/pages/502.pug`,
		`${paths.pug.src}/pages/503.pug`,
		`${paths.pug.src}/pages/504.pug`
	])
		.pipe(gulppug({ locals }))
		.pipe(gulp.dest(paths.pug.dest));
}

async function langs() {
	const i18n = require(__dirname+'/lib/locale/locale.js');
	await del([ 'static/js/lang/' ]);
	fs.mkdirSync(`${paths.scripts.dest}lang/`);
	const feStrings = require(__dirname+'/tools/festrings.json');
	Object.entries(i18n.getCatalog())
		.forEach(entry => {
			const [lang, dict] = entry;
			const minimalDict = feStrings.reduce((acc, key) => {
				acc[key] = dict[key];
				return acc;
			}, {});
			const langScript = `const LANG = '${lang}';
const TRANSLATIONS = ${JSON.stringify(minimalDict)};`;
			fs.writeFileSync(`${paths.scripts.dest}lang/${lang}.js`, langScript);
		});
}

async function scripts() {
	const { themes, codeThemes } = require(__dirname+'/lib/misc/themes.js');
	try {

		// compile some locals/variables needed from configs in fe scripts
		const captchaOptions = config.get.captchaOptions;
		//smaller set of captchaoptions needed for some frontend scripts to build includes
		const reducedCaptchaOptions = {
			grid: {
				size: captchaOptions.grid.size,
				question: captchaOptions.grid.question,
			},
			type: captchaOptions.type,
		};
		const locals = `const themes = ['${themes.join('\', \'')}'];
const codeThemes = ['${codeThemes.join('\', \'')}'];
const captchaOptions = ${JSON.stringify(reducedCaptchaOptions)};
const SERVER_TIMEZONE = '${Intl.DateTimeFormat().resolvedOptions().timeZone}';
const settings = ${JSON.stringify(config.get.frontendScriptDefault)};
const extraLocals = ${JSON.stringify({ meta: config.get.meta, reverseImageLinksURL: config.get.reverseImageLinksURL })};
`;
		fs.writeFileSync('gulp/res/js/locals.js', locals);

//		const pugRuntimeFuncs = pugRuntime(['classes', 'style', 'attr', 'escape']);
//		fs.writeFileSync('gulp/res/js/pugruntime.js', pugRuntimeFuncs);
		
		//compile some pug client side functions
		['modal', 'post', 'uploaditem', 'pugfilters', 'captchaformsection', 'watchedthread', 'threadwatcher']
			.forEach(templateName => {
				const compilationOptions = {
					compileDebug: false,
					debug: false,
					name: templateName,
					inlineRuntimeFunctions: true, //note pugRuntime above, will fix pending issue open on pug github
				};
				const compiledClient = pug.compileFileClient(`${paths.pug.src}includes/${templateName}.pug`, compilationOptions);
				fs.writeFileSync(`gulp/res/js/${templateName}.js`, compiledClient);
			});

		//symlink socket.io file
		fs.symlinkSync(__dirname+'/node_modules/socket.io/client-dist/socket.io.min.js', __dirname+'/gulp/res/js/socket.io.js', 'file');

	} catch (e) {

		//ignore EEXIST, probably the socket.io
		if (e.code !== 'EEXIST') {
			console.log(e);
		}

	}

	gulp.src([
		//put scripts in order for dependencies
		`${paths.scripts.src}/locals.js`,
		`${paths.scripts.src}/i18n.js`,
		`${paths.scripts.src}/localstorage.js`,
//		`${paths.scripts.src}/pugruntime.js`,
		`${paths.scripts.src}/modal.js`,
		`${paths.scripts.src}/pugfilters.js`,
		`${paths.scripts.src}/post.js`,
		`${paths.scripts.src}/settings.js`,
		`${paths.scripts.src}/live.js`,
		`${paths.scripts.src}/captcha.js`,
		`${paths.scripts.src}/tegaki.js`,
		`${paths.scripts.src}/forms.js`,
		`${paths.scripts.src}/*.js`,
		`!${paths.scripts.src}/saveoverboard.js`,
		`!${paths.scripts.src}/hidefileinput.js`,
		`!${paths.scripts.src}/dragable.js`,
		`!${paths.scripts.src}/watchlist.js`,
		`!${paths.scripts.src}/filters.js`,
		`!${paths.scripts.src}/hideimages.js`,
		`!${paths.scripts.src}/yous.js`,
		`!${paths.scripts.src}/catalog.js`,
		`!${paths.scripts.src}/time.js`,
		`!${paths.scripts.src}/timezone.js`,
	])
		.pipe(concat('all.js'))
		.pipe(uglify({compress:true}))
		.pipe(gulp.dest(paths.scripts.dest));

	return gulp.src([
		`${paths.scripts.src}/saveoverboard.js`,
		`${paths.scripts.src}/hidefileinput.js`,
		`${paths.scripts.src}/dragable.js`,
		`${paths.scripts.src}/hideimages.js`,
		`${paths.scripts.src}/yous.js`,
		`${paths.scripts.src}/filters.js`,
		`${paths.scripts.src}/watchlist.js`,
		`${paths.scripts.src}/catalog.js`,
		`${paths.scripts.src}/time.js`,
	])
		.pipe(concat('render.js'))
		.pipe(uglify({compress:true}))
		.pipe(gulp.dest(paths.scripts.dest));

}

async function migrate() {
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
				process.exit(1);
			}
			console.log(`Finished migrating to version ${ver}`);
		}
	} else {
		console.log(`Migration not required, you are already on the current version (${migrateVersion})`);
	}
}

async function init() {
	const defaultConfig = require(__dirname+'/configs/template.js.example');
	await Mongo.connect();
	const globalSettings = await Mongo.getConfig();
	if (!globalSettings) {
		await Mongo.setConfig(defaultConfig);
	}
	await config.load();
}

async function closeConnections() {
	Redis.close();
	if (Mongo.client) {
		await Mongo.client.close();
	}
}

const build = gulp.parallel(gulp.series(scripts, langs, css), images, icons, gulp.series(deletehtml, custompages));

//godhelpme
module.exports = {
	'generate-favicon': gulp.series('generate-favicon', closeConnections),
	html: gulp.series(init, deletehtml, custompages, closeConnections),
	css: gulp.series(init, css, closeConnections),
	images: gulp.series(images, closeConnections),
	icons: gulp.series('check-for-favicon-update', icons, closeConnections),
	reset: gulp.series(init, wipe, build, closeConnections),
	custompages: gulp.series(init, custompages, closeConnections),
	scripts: gulp.series(init, scripts, closeConnections),
	cache: gulp.series(cache, closeConnections),
	migrate: gulp.series(init, migrate, closeConnections),
	password: gulp.series(init, password, closeConnections),
	langs: gulp.series(init, langs, closeConnections),
	ips: gulp.series(init, ips, closeConnections),
	default: gulp.series(init, build, closeConnections),
	buildTasks: { //dont include init, etc
		deletehtml,
		css,
		scripts,
		custompages,
	}
};
