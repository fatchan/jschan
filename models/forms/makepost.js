'use strict';

const path = require('path')
	, { createHash, randomBytes } = require('crypto')
	, { remove, pathExists } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, Mongo = require(__dirname+'/../../db/db.js')
	, Socketio = require(__dirname+'/../../socketio.js')
	, { Stats, Posts, Boards, Files, Bans } = require(__dirname+'/../../db/')
	, cache = require(__dirname+'/../../redis.js')
	, getTripCode = require(__dirname+'/../../helpers/posting/tripcode.js')
	, linkQuotes = require(__dirname+'/../../helpers/posting/quotes.js')
	, { markdown } = require(__dirname+'/../../helpers/posting/markdown.js')
	, sanitizeOptions = require(__dirname+'/../../helpers/posting/sanitizeoptions.js')
	, sanitize = require('sanitize-html')
	, nameRegex = /^(?<name>[^\s#]+)?(?:##(?<tripcode>[^ ]{1}[^\s#]+))?(?<capcode>##(?<capcodetext> [^#]+)?)?$/
	, moveUpload = require(__dirname+'/../../helpers/files/moveupload.js')
	, fileCheckMimeType = require(__dirname+'/../../helpers/files/mimetypes.js')
	, imageThumbnail = require(__dirname+'/../../helpers/files/imagethumbnail.js')
	, imageIdentify = require(__dirname+'/../../helpers/files/imageidentify.js')
	, videoThumbnail = require(__dirname+'/../../helpers/files/videothumbnail.js')
	, ffprobe = require(__dirname+'/../../helpers/files/ffprobe.js')
	, formatSize = require(__dirname+'/../../helpers/files/formatsize.js')
	, deleteTempFiles = require(__dirname+'/../../helpers/files/deletetempfiles.js')
	, fixGifs = require(__dirname+'/../../helpers/files/fixgifs.js')
	, timeUtils = require(__dirname+'/../../helpers/timeutils.js')
	, deletePosts = require(__dirname+'/deletepost.js')
	, spamCheck = require(__dirname+'/../../helpers/checks/spamcheck.js')
	, { thumbSize, thumbExtension, postPasswordSecret } = require(__dirname+'/../../configs/main.js')
	, buildQueue = require(__dirname+'/../../queue.js')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, { buildThread } = require(__dirname+'/../../helpers/tasks.js');

module.exports = async (req, res, next) => {

	//spam/flood check
	const flood = await spamCheck(req, res);
	if (flood) {
		deleteTempFiles(req).catch(e => console.error);
		return dynamicResponse(req, res, 429, 'message', {
			'title': 'Flood detected',
			'message': 'Please wait before making another post, or a post similar to another user',
			'redirect': `/${req.params.board}${req.body.thread ? '/thread/' + req.body.thread + '.html' : ''}`
		});
	}

	// check if this is responding to an existing thread
	let redirect = `/${req.params.board}/`
	let salt = null;
	let thread = null;
	const { filters, filterBanDuration, filterMode,
			maxFiles, forceAnon, replyLimit,
			threadLimit, ids, userPostSpoiler,
			defaultName, pphTrigger, tphTrigger, triggerAction,
			captchaMode, locked, allowedFileTypes, flags } = res.locals.board.settings;
	if (locked === true) {
		await deleteTempFiles(req).catch(e => console.error);
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'message': 'Board is locked.',
			'redirect': redirect
		});
	}
	if (req.body.thread) {
		thread = await Posts.getPost(req.params.board, req.body.thread, true);
		if (!thread || thread.thread != null) {
			await deleteTempFiles(req).catch(e => console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'message': 'Thread does not exist.',
				'redirect': redirect
			});
		}
		salt = thread.salt;
		redirect += `thread/${req.body.thread}.html`
		if (thread.locked && res.locals.permLevel >= 4) {
			await deleteTempFiles(req).catch(e => console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'message': 'Thread Locked',
				'redirect': redirect
			});
		}
		if (thread.replyposts >= replyLimit && !thread.cyclic) { //reply limit
			await deleteTempFiles(req).catch(e => console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'message': 'Thread reached reply limit',
				'redirect': redirect
			});
		}
	}
	//filters
	if (res.locals.permLevel > 1) { //global staff bypass filters
		const allContents = req.body.name+req.body.message+req.body.subject+req.body.email
			, globalSettings = await cache.get('globalsettings');
		let hitGlobalFilter = false
			, hitLocalFilter = false
			, ban;
		//global filters
		if (globalSettings && globalSettings.filters.length > 0 && globalSettings.filterMode > 0) {
			hitGlobalfilter = globalSettings.filters.some(filter => { return allContents.includes(filter) });
		}
		//board-specific filters
		if (!hitGlobalFilter && res.locals.permLevel >= 4 && filterMode > 0 && filters && filters.length > 0) {
			hitLocalFilter = filters.some(filter => { return allContents.includes(filter) });
		}
		if (hitGlobalFilter || hitLocalFilter) {
			await deleteTempFiles(req).catch(e => console.error);
			const useFilterMode = hitGlobalFilter ? globalSettings.filterMode : filterMode; //global override local filter
			if (useFilterMode === 1) {
				return dynamicResponse(req, res, 400, 'message', {
					'title': 'Bad request',
					'message': 'Your post was blocked by a word filter',
					'redirect': redirect
				});
			} else { //otherwise filter mode must be 2
				const useFilterBanDuration = hitGlobalFilter ? globalSettings.filterBanDuration : filterBanDuration;
				const banBoard = hitGlobalFilter ? null : res.locals.board._id;
				const banDate = new Date();
				const banExpiry = new Date(useFilterBanDuration + banDate.getTime());
				const ban = {
					'ip': res.locals.ip.hash,
					'reason': 'post word filter auto ban',
					'board': banBoard,
					'posts': null,
					'issuer': 'system', //what should i call this
					'date': banDate,
					'expireAt': banExpiry,
					'allowAppeal': true, //should i make this configurable if appealable?
					'seen': false
				};
 				await Bans.insertOne(ban);
				const bans = await Bans.find(res.locals.ip.hash, banBoard); //need to query db so it has _id field for appeal checkmark
				return res.status(403).render('ban', {
					bans: bans
				});
			}
		}

	}
	let files = [];
	// if we got a file
	if (res.locals.numFiles > 0) {
		// check all mime types befoer we try saving anything
		for (let i = 0; i < res.locals.numFiles; i++) {
			if (!fileCheckMimeType(req.files.file[i].mimetype, allowedFileTypes)) {
				await deleteTempFiles(req).catch(e => console.error);
				return dynamicResponse(req, res, 400, 'message', {
					'title': 'Bad request',
					'message': `Mime type "${req.files.file[i].mimetype}" for "${req.files.file[i].name}" not allowed.`,
					'redirect': redirect
				});
			}
		}
		// then upload, thumb, get metadata, etc.
		for (let i = 0; i < res.locals.numFiles; i++) {
			const file = req.files.file[i];
			let extension = path.extname(file.name) || file.name.substring(file.name.indexOf('.'));
			file.filename = file.sha256 + extension;

			//get metadata
			let processedFile = {
					hash: file.sha256,
					filename: file.filename, //could probably remove since we have hash and extension
					originalFilename: file.name,
					mimetype: file.mimetype,
					size: file.size,
					extension,
			};

			//type and subtype
			const [type, subtype] = processedFile.mimetype.split('/');
			if (type !== 'audio') { //audio doesnt need thumb
				processedFile.thumbextension = thumbExtension;
			}
			let imageData;
			if (type === 'image') {
				///detect images with opacity for PNG thumbnails, settumh thumbextension before increment
				imageData = await imageIdentify(req.files.file[i].tempFilePath, null, true);
				if (imageData['Channel Statistics'] && imageData['Channel Statistics']['Opacity']) { //does this change depending on GM version or anything?
					const opacityMaximum = imageData['Channel Statistics']['Opacity']['Maximum'];
					if (opacityMaximum !== '0.00 (0.0000)') {
						processedFile.thumbextension = '.png';
					}
				}
			}

			//increment file count
			await Files.increment(processedFile);

			//check if already exists
			const existsFull = await pathExists(`${uploadDirectory}/img/${processedFile.filename}`);
			switch (type) {
				case 'image': {
					const existsThumb = await pathExists(`${uploadDirectory}/img/thumb-${processedFile.hash}${processedFile.thumbextension}`);
					processedFile.geometry = imageData.size // object with width and height pixels
					processedFile.sizeString = formatSize(processedFile.size) // 123 Ki string
					processedFile.geometryString = imageData.Geometry // 123 x 123 string
					processedFile.hasThumb = !(fileCheckMimeType(file.mimetype, {image: true})
						&& processedFile.geometry.height <= thumbSize
						&& processedFile.geometry.width <= thumbSize);
					if (!existsFull) {
						await moveUpload(file, processedFile.filename, 'img');
					}
					if (!existsThumb && processedFile.hasThumb) {
						await imageThumbnail(processedFile);
					}
					processedFile = fixGifs(processedFile);
					break;
				}
				case 'video': {
					const existsThumb = await pathExists(`${uploadDirectory}/img/thumb-${processedFile.hash}${processedFile.thumbextension}`);
					//video metadata
					const videoData = await ffprobe(req.files.file[i].tempFilePath, null, true);
					videoData.streams = videoData.streams.filter(stream => stream.width != null); //filter to only video streams or something with a resolution
					if (videoData.streams.length <= 0) {
						await deleteTempFiles(req).catch(e => console.error);
						return dynamicResponse(req, res, 400, 'message', {
							'title': 'Bad request',
							'message': 'Audio only video file not supported (yet)',
							'redirect': redirect
						});
					}
					processedFile.duration = videoData.format.duration;
					processedFile.durationString = new Date(videoData.format.duration*1000).toISOString().substr(11,8).replace(/^00:/, '');//breaks for over 24h video
					processedFile.geometry = {width: videoData.streams[0].coded_width, height: videoData.streams[0].coded_height} // object with width and height pixels
					processedFile.sizeString = formatSize(processedFile.size) // 123 Ki string
					processedFile.geometryString = `${processedFile.geometry.width}x${processedFile.geometry.height}` // 123 x 123 string
					processedFile.hasThumb = true;
					if (!existsFull) {
						await moveUpload(file, processedFile.filename, 'img');
					}
					if (!existsThumb) {
						await videoThumbnail(processedFile, processedFile.geometry);
					}
					break;
				}
				case 'audio': {
					const audioData = await ffprobe(req.files.file[i].tempFilePath, null, true);
					processedFile.duration = audioData.format.duration;
					processedFile.durationString = new Date(audioData.format.duration*1000).toISOString().substr(11,8).replace(/^00:/, '');//breaks for over 24h video
					processedFile.sizeString = formatSize(processedFile.size) // 123 Ki string
					processedFile.hasThumb = false;
					if (!existsFull) {
						await moveUpload(file, processedFile.filename, 'img');
					}
					break;
				}
				default:
					throw new Error(`invalid file mime type: ${processedFile}`); //throw so goes to error handler before next'ing
			}

			if (processedFile.hasThumb === true) {
				//handle gifs that are always thumbed to prevent animation but may be smaller than thumbsize to avoid stretched thumb
				const minThumbWidth = Math.min(processedFile.geometry.width, thumbSize);
				const minThumbHeight = Math.min(processedFile.geometry.height, thumbSize);
				const ratio = processedFile.geometry.width/processedFile.geometry.height;
				if (ratio >= 1) {
					processedFile.geometry.thumbwidth = minThumbWidth;
					processedFile.geometry.thumbheight = Math.ceil(minThumbHeight/ratio);
				} else {
					processedFile.geometry.thumbwidth = Math.ceil(minThumbWidth*ratio);
					processedFile.geometry.thumbheight = minThumbHeight;
				}
			}

			//delete the temp file
			await remove(file.tempFilePath);

			files.push(processedFile);
		}
	}
	// because express middleware is autistic i need to do this
	deleteTempFiles(req).catch(e => console.error);

	let userId = null;
	if (!salt) {
		//thread salt for IDs
		salt = (await randomBytes(128)).toString('base64');
	}
	if (ids === true) {
		const fullUserIdHash = createHash('sha256').update(salt + res.locals.ip.hash).digest('hex');
		userId = fullUserIdHash.substring(fullUserIdHash.length-6);
	}
	let country = null;
	if (flags === true) {
		country = {
			'code': req.headers['x-country-code'],
			'name': req.headers['x-country-name']
		}
	}
	let password = null;
	if (req.body.password) {
		password = createHash('sha256').update(postPasswordSecret + req.body.password).digest('base64');
	}

	//forceanon hide reply subjects so cant be used as name for replies
	//forceanon only allow sage email
	let subject = (res.locals.permLevel < 4 || !forceAnon || !req.body.thread) ? req.body.subject : null;
	let email = (res.locals.permLevel < 4 || !forceAnon || req.body.email === 'sage') ? req.body.email : null;

	//spoiler files only if board settings allow
	const spoiler = userPostSpoiler && req.body.spoiler ? true : false;

	let name = defaultName;
	let tripcode = null;
	let capcode = null;
	if ((res.locals.permLevel < 4 || !forceAnon) && req.body.name && req.body.name.length > 0) {
		// get matches with named groups for name, trip and capcode in 1 regex
		const matches = req.body.name.match(nameRegex);
		if (matches && matches.groups) {
			const groups = matches.groups;
			//name
			if (groups.name) {
				name = groups.name;
			}
			//tripcode
			if (groups.tripcode) {
				tripcode = `!!${(await getTripCode(groups.tripcode))}`;
			}
			//capcode
			if (res.locals.permLevel < 4 && groups.capcode) {
				let type = '';
				switch (res.locals.permLevel) {
					case 3://board mod
						type = 'Board Mod';
						break;
					case 2://board owner
						type = 'Board Owner';
						break;
					case 1://global staff
						type = 'Global Staff';
						break;
					case 0://admin
						type = 'Admin';
						break;
				}
				capcode = groups.capcodetext ? groups.capcodetext.trim() : type;
				if (type.toLowerCase() === capcode.toLowerCase()) {
					capcode = type;
				} else {
					capcode = `${type} ${capcode}`;
				}
				capcode = `##${capcode}`;
			}
		}
	}

	//simple markdown and sanitize
	let message = req.body.message;
	let quotes = [];
	let crossquotes = [];
	if (message && message.length > 0) {
		message = markdown(message);
		const { quotedMessage, threadQuotes, crossQuotes } = await linkQuotes(req.params.board, message, req.body.thread || null);
		message = quotedMessage;
		quotes = threadQuotes;
		crossquotes = crossQuotes;
		message = sanitize(message, sanitizeOptions.after);
	}

	//build post data for db
	const data = {
		'date': new Date(),
		name,
		country,
		'board': req.params.board,
		tripcode,
		capcode,
		subject,
		'message': message || null,
		'nomarkup': req.body.message || null,
		'thread': req.body.thread || null,
		password,
		email,
		spoiler,
		'banmessage': null,
		userId,
		'ip': res.locals.ip,
		files,
		'reports': [],
		'globalreports': [],
		quotes, //posts this post replies to
		crossquotes, //quotes to other threads in same board
		'backlinks': [], //posts replying to this post
	}

	if (!req.body.thread) {
		//if this is a thread, add thread specific properties
		Object.assign(data, {
			'replyposts': 0,
			'replyfiles': 0,
			//NOTE: these are numbers because we XOR them for toggling in action handler
			'sticky': Mongo.NumberInt(0),
			'locked': Mongo.NumberInt(0),
			'bumplocked': Mongo.NumberInt(0),
			'cyclic': Mongo.NumberInt(0),
			'salt': salt
		});
	}

	const postId = await Posts.insertOne(res.locals.board, data, thread);

	let enableCaptcha = false;
	if (triggerAction > 0 //trigger is enabled and not already been triggered
		&& (tphTrigger > 0 || pphTrigger > 0)
		&& ((triggerAction < 3 && captchaMode < triggerAction)
			|| (triggerAction === 3 && locked !== true))) {
		//read stats to check number threads in past hour
		const hourPosts = await Stats.getHourPosts(res.locals.board._id);
		if (hourPosts //if stats exist for this hour and its above either trigger
			&& (tphTrigger > 0 && hourPosts.tph >= tphTrigger)
				|| (pphTrigger > 0 && hourPosts.pph > pphTrigger)) {
			//update in memory for other stuff done e.g. rebuilds
			const update = {
				'$set': {}
			};
			if (triggerAction < 3) {
				res.locals.board.settings.captchaMode = triggerAction;
				update['$set']['settings.captchaMode'] = triggerAction;
				enableCaptcha = true;
			} else if (triggerAction === 3) {
				res.locals.board.settings.locked = true;
				update['$set']['settings.locked'] = true;
			}
			//set it in the db
			await Boards.updateOne(res.locals.board._id, update);
		}
	}

	//for cyclic threads, delete posts beyond bump limit
	if (thread && thread.cyclic && thread.replyposts > replyLimit) {
		const cyclicOverflowPosts = await Posts.db.find({
			'thread': data.thread,
			'board': req.params.board
		}).sort({
			'postId': -1,
		}).skip(replyLimit).toArray();
		if (cyclicOverflowPosts.length > 0) {
			await deletePosts(cyclicOverflowPosts, req.params.board);
			const fileCount = cyclicOverflowPosts.reduce((post, acc) => {
				return acc + post.files.length;
			}, 0);
			//reduce amount counted in post by number of posts deleted
			await Posts.db.updateOne({
				'postId': thread.postId,
				'board': board._id
			}, {
				'$inc': { //negative increment
					'replyposts': -cyclicOverflowPosts.length,
					'replyfiles': -fileCount
				}
			});
		}
	}

	const successRedirect = `/${req.params.board}/thread/${req.body.thread || postId}.html#${postId}`;

	const buildOptions = {
		'threadId': data.thread || postId,
		'board': res.locals.board
	};
	if (req.headers['x-using-xhr'] != null && data.thread) {
		//if this is a reply, and sent with xhr just respond with postId so we can highlight and live insert
		res.json({ 'postId': postId });
		buildQueue.push({
			'task': 'buildThread',
			'options': buildOptions
		});
	} else {
		//build just the thread they need to see immediately for regular form posts/noscript users
		await buildThread(buildOptions);
		res.redirect(successRedirect);
	}

	if (data.thread) {
		//only emit for replies and with some omissions
		const projectedPost = {
			'date': data.date,
			'name': data.name,
			'country': data.country,
			'board': req.params.board,
			'tripcode': data.tripcode,
			'capcode': data.capcode,
			'subject': data.subject,
			'message': data.message,
			'nomarkup': data.nomarkup,
			'thread': data.thread,
			'postId': postId,
			'email': data.email,
			'spoiler': data.spoiler,
			'banmessage': null,
			'userId': data.userId,
			'files': data.files,
			'reports': [],
			'globalreports': [],
			'quotes': data.quotes,
			'backlinks': [],
			'replyposts': 0,
			'replyfiles': 0,
			'sticky': data.sticky,
			'locked': data.locked,
			'bumplocked': data.bumplocked,
			'cyclic': data.cyclic,
		}
		Socketio.emitRoom(`${res.locals.board._id}-${data.thread}`, 'newPost', projectedPost);
	}

	//now add other pages to be built in background
	if (enableCaptcha) {
		if (res.locals.board.settings.captchaMode == 2) {
			//only delete threads if all posts require threads, otherwise just build board pages for thread captcha
			await remove(`${uploadDirectory}/html/${req.params.board}/thread/`); //not deleting json cos it doesnt need to be
		}
		const endPage = Math.ceil(threadLimit/10);
		buildQueue.push({
			'task': 'buildBoardMultiple',
			'options': {
				'board': res.locals.board,
				'startpage': 1,
				'endpage': endPage
			}
		});
	} else if (data.thread) {
		//refersh pages
		const threadPage = await Posts.getThreadPage(req.params.board, thread);
		if (data.email === 'sage' || thread.bumplocked) {
			//refresh the page that the thread is on
			buildQueue.push({
				'task': 'buildBoard',
				'options': {
					'board': res.locals.board,
					'page': threadPage
				}
			});
		} else {
			//if not saged, it will bump so we should refresh any pages above it as well
			buildQueue.push({
				'task': 'buildBoardMultiple',
				'options': {
					'board': res.locals.board,
					'startpage': 1,
					'endpage': threadPage
				}
			});
		}
	} else if (!data.thread) {
		//new thread, prunes any old threads before rebuilds
		const prunedThreads = await Posts.pruneThreads(res.locals.board);
		if (prunedThreads.length > 0) {
			await deletePosts(prunedThreads, req.params.board);
		}
		if (!enableCaptcha) {
			const endPage = Math.ceil(threadLimit/10);
			buildQueue.push({
				'task': 'buildBoardMultiple',
				'options': {
					'board': res.locals.board,
					'startpage': 1,
					'endpage': endPage
				}
			});
		}
	}

	//always rebuild catalog for post counts and ordering
	buildQueue.push({
		'id': `${req.params.board}:catalog`,
		'task': 'buildCatalog',
		'options': {
			'board': res.locals.board,
		}
	});

}
