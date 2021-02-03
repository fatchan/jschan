'use strict';

const { Boards, Posts, Accounts } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, buildQueue = require(__dirname+'/../../queue.js')
	, cache = require(__dirname+'/../../redis.js')
	, { remove } = require('fs-extra');

module.exports = async (req, res, next) => {

	const promises = [];
	const oldSettings = await cache.get('globalsettings');
	const newSettings = {
//todo: holy fuck this is gonna be too much boilerplate, not like per-board settings wasnt too much already (^:
//todo: make massive fucking template update for expanded global settings page
//idea: for permissions level and stuff, we can show the name as "Admin" and send the value as perm level number
		secureCookies: true,
		refererCheck: true,
		allowedHosts: [],
		countryCodeHeader: 'x-country-code',
		ipHeader: 'x-real-ip',
		meta: {
			siteName: 'fatchan',
			url: 'https://fatchan.org'
		},
		captchaOptions: {
			type: 'grid',
			generateLimit: 250,
			google: {
				siteKey: 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
				secretKey: 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz'
			},
			hcaptcha: {
				siteKey: 'zzzz',
				secretKey: 'xxxxxxxxxxxxxxxx'
			},
			grid: {
				size: 4,
				imageSize: 120,
				iconYOffset: 15,
			},
			numDistorts: {
				min: 2,
				max: 3
			},
			distortion: 7,
		},
		dnsbl: {
			enabled: false,
			blacklists: ['tor.dan.me.uk', 'zen.spamhaus.org'],
			cacheTime: 3600
		},
		disableAnonymizerFilePosting: false,
		statsCountAnonymizers: true,
		floodTimers: {
			sameContentSameIp: 120000,
			sameContentAnyIp: 30000,
			anyContentSameIp: 5000,
		},
		blockBypass: {
			enabled: true,
			forceAnonymizers: true,
			expireAfterUses: 50,
			expireAfterTime: 86400000,
			bypassDnsbl: false,
		},
		ipHashPermLevel: 0,
		deleteBoardPermLevel: 2,
		pruneImmediately: true,
		hashImages: false,
		rateLimitCost: {
			captcha: 11,
			boardSettings: 30,
			editPost: 30,
		},
		overboardLimit: 20,
		overboardCatalogLimit: 50,
		cacheTemplates: true,
		debugLogs: true,
		lockWait: 3000,
		pruneModlogs: 30,
		pruneIps: false,
		enableWebring: true,
		enableUserBoardCreation: false,
		enableUserAccountCreation: true,
		thumbExtension: '.jpg',
		animatedGifThumbnails: false,
		audioThumbnails: true,
		ffmpegGifThumbnails: true,
		thumbSize: 250,
		videoThumbPercentage: 5,
		otherMimeTypes: [
			'text/plain',
			'application/pdf',
			'application/x-sid',
		],
		checkRealMimeTypes: false,
		allowMimeNoMatch: false,
		defaultBanDuration: 31536000000,
		quoteLimit: 25,
		strictFiltering: true,
		previewReplies: 5,
		stickyPreviewReplies: 5,
		early404Fraction: 3,
		early404Replies: 5,
		maxRecentNews: 5,
		filterFileNames: false,
		spaceFileNameReplacement: '_',
		highlightOptions: {
			languageSubset: [
				'javascript',
				'typescript',
				'perl',
				'js',
				'c++',
				'c',
				'java',
				'kotlin',
				'php',
				'h',
				'csharp',
				'bash',
				'sh',
				'zsh',
				'python',
				'ruby',
				'css',
				'html',
				'json',
				'golang',
				'rust'
			],
			threshold: 5

		},
		themes: [],
		codeThemes: [],
		globalLimits:  {
			threadLimit: {
				min: 10,
				max: 200
			},
			replyLimit: {
				min: 10,
				max: 1000
			},
			bumpLimit: {
				min: 10,
				max: 1000
			},
			postFiles: {
				max: 5
			},
			postFilesSize: {
				max: 21023948
			},
			bannerFiles: {
				width: 600,
				height: 600,
				forceAspectRatio: false,
				max: 10,
				total: 100,
			},
			bannerFilesSize: {
				max: 10485760
			},
			fieldLength: {
				name: 100,
				email: 100,
				subject: 100,
				postpassword: 100,
				message: 20000,
				report_reason: 100,
				ban_reason: 100,
				log_message: 100,
				uri: 50,
				boardname: 50,
				description: 100,
			},
			multiInputs: {
				posts: {
					anon: 20,
					staff: 100,
				},
			},
			customCss: {
				enabled: true,
				max: 10000,
				strict: true,
				filters: [
					'@',
					'url(',
				]
			},
			customPages: {
				max: 5,
				maxLength: 10000,
			}
		},
		frontendScriptDefault: {
			embedsEnabled: true,
			heightUnlimit: false,
			hideRecursive: true,
			crispImages: false,
			hideThumbnails: false,
			nonColorIds: false,
			alwaysShowSpoilers: false,
			hidePostStubs: false,
			smoothScrolling: true,
			defaultVolume: 100,
			loop: true,
			imageLoadingBars: true,
			live: true,
			scrollToPosts: false,
			localTime: true,
			hour24Time: false,
			relativeTime: true,
			notificationsEnabled: false,
			notificationsYousOnly: true,
			showYous: true,
		},
		boardDefaults: {
			theme: 'clear',
			codeTheme: 'ir-black',
			sfw: false,
			lockMode: 0,
			fileR9KMode: 0,
			messageR9KMode: 0,
			unlistedLocal: false,
			unlistedWebring: false,
			captchaMode: 0,
			tphTrigger: 10,
			pphTrigger: 50,
			tphTriggerAction: 1,
			pphTriggerAction: 2,
			captchaReset: 0,
			lockReset: 0,
			forceAnon: false,
			sageOnlyEmail: false,
			early404: true,
			ids: false,
			flags: false,
			userPostDelete: true,
			userPostSpoiler: true,
			userPostUnlink: true,
			threadLimit: 200,
			replyLimit: 700,
			bumpLimit: 500,
			maxFiles: 5,
			forceReplyMessage: false,
			forceReplyFile: false,
			forceThreadMessage: false,
			forceThreadFile: false,
			forceThreadSubject: false,
			disableReplySubject: false,
			minThreadMessageLength: 0,
			minReplyMessageLength: 0,
			maxThreadMessageLength: 20000,
			maxReplyMessageLength: 20000,
			defaultName: 'Anon',
			customCSS: null,
			blockedCountries: [],
			disableAnonymizerFilePosting: false,
			filters: [],
			filterMode: 0,
			filterBanDuration: 0,
			strictFiltering: false,
			announcement: {
				raw: null,
				markdown: null
			},
			allowedFileTypes: {
				animatedImage: true,
				image: true,
				video: true,
				audio: true,
				other: false
			}
		},
		'filters': req.body.filters !== null ? req.body.filters.split(/\r?\n/).filter(n => n) : oldSettings.filters,
		'filterMode': typeof req.body.filter_mode === 'number' && req.body.filter_mode !== oldSettings.filterMode ? req.body.filter_mode : oldSettings.filterMode,
		'filterBanDuration': typeof req.body.ban_duration === 'number' && req.body.ban_duration !== oldSettings.filterBanDuration ? req.body.ban_duration : oldSettings.filterBanDuration,
	};

	cache.set('globalsettings', newSettings);

	let rebuildThreads = false
		, rebuildBoard = false
		, rebuildCatalog = false;

/*
//todo: implement removing pages/rebuilding for all affected boards i.e. query for ones with settings.catchaMode < newSettings.captchaMode
	if (newSettings.captchaMode > oldSettings.captchaMode) {
		rebuildBoard = true;
		rebuildCatalog = true;
		if (newSettings.captchaMode == 2) {
			rebuildThreads = true; //thread captcha enabled, removes threads
		}
		const affectedBoards = //query here
		for (let i = 0; i < affectedBoards.length; i++) {
			const board = affectedBoards[i];
			if (rebuildThreads) {
				promises.push(remove(`${uploadDirectory}/html/${board._id}/thread/`));
			}
			if (rebuildBoard) {
				buildQueue.push({
					'task': 'buildBoardMultiple',
					'options': {
						board,
						'startpage': 1,
						'endpage': null //no endpage will use whatver maxpage of board is
					}
				});
			}
			if (rebuildCatalog) {
				buildQueue.push({
					'task': 'buildCatalog',
					'options': {
						board,
					}
				});
			}
		}
	}
*/

	//finish the promises in parallel e.g. removing files
	if (promises.length > 0) {
		await Promise.all(promises);
	}

	//publish to redis so running processes get updated config
	cache.redisPublisher.publish('config', 'TODO: put the full config object here, so no need to query db on all instances');

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': 'Updated settings.',
		'redirect': '/globalmanage/settings.html'
	});

}
