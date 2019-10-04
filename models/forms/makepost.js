'use strict';

const path = require('path')
	, { createHash, randomBytes } = require('crypto')
	, { remove, pathExists } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, Mongo = require(__dirname+'/../../db/db.js')
	, Socketio = require(__dirname+'/../../socketio.js')
	, { Stats, Posts, Boards, Files, Bans } = require(__dirname+'/../../db/')
	, getTripCode = require(__dirname+'/../../helpers/posting/tripcode.js')
	, linkQuotes = require(__dirname+'/../../helpers/posting/quotes.js')
	, escape = require(__dirname+'/../../helpers/posting/escape.js')
	, simpleMarkdown = require(__dirname+'/../../helpers/posting/markdown.js')
	, sanitizeOptions = require(__dirname+'/../../helpers/posting/sanitizeoptions.js')
	, sanitize = require('sanitize-html')
	, nameRegex = /^(?<name>[^\s#]+)?(?:##(?<tripcode>[^ ]{1}[^\s#]+))?(?:## (?<capcode>[^\s#]+))?$/
	, imageUpload = require(__dirname+'/../../helpers/files/imageupload.js')
	, videoUpload = require(__dirname+'/../../helpers/files/videoupload.js')
	, fileCheckMimeType = require(__dirname+'/../../helpers/files/mimetypes.js')
	, imageThumbnail = require(__dirname+'/../../helpers/files/imagethumbnail.js')
	, imageIdentify = require(__dirname+'/../../helpers/files/imageidentify.js')
	, videoThumbnail = require(__dirname+'/../../helpers/files/videothumbnail.js')
	, videoIdentify = require(__dirname+'/../../helpers/files/videoidentify.js')
	, formatSize = require(__dirname+'/../../helpers/files/formatsize.js')
	, deleteTempFiles = require(__dirname+'/../../helpers/files/deletetempfiles.js')
	, fixGifs = require(__dirname+'/../../helpers/files/fixgifs.js')
	, msTime = require(__dirname+'/../../helpers/mstime.js')
	, deletePosts = require(__dirname+'/deletepost.js')
	, spamCheck = require(__dirname+'/../../helpers/checks/spamcheck.js')
	, { thumbSize, thumbExtension, postPasswordSecret } = require(__dirname+'/../../configs/main.json')
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
			defaultName, tphTrigger, tphTriggerAction,
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
	if (res.locals.numFiles > maxFiles) {
		await deleteTempFiles(req).catch(e => console.error);
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'message': `Too many files. Max files per post is ${maxFiles}.`,
			'redirect': redirect
		});
	}
	//filters
	if (res.locals.permLevel >= 4 && filterMode > 0 && filters && filters.length > 0) {
		const allContents = req.body.name+req.body.message+req.body.subject+req.body.email;
		const containsFilter = filters.some(filter => { return allContents.includes(filter) });
		if (containsFilter === true) {
			await deleteTempFiles(req).catch(e => console.error);
			if (filterMode === 1) {
				return dynamicResponse(req, res, 400, 'message', {
					'title': 'Bad request',
					'message': 'Your post was blocked by a word filter',
					'redirect': redirect
				});
			} else if (filterMode === 2) {
				const banDate = new Date();
				const banExpiry = new Date(filterBanDuration + banDate.getTime());
				const ban = {
					'ip': res.locals.ip.hash,
					'reason': 'post word filter auto ban',
					'board': res.locals.board._id,
					'posts': null,
					'issuer': 'system', //what should i call this
					'date': banDate,
					'expireAt': banExpiry,
					'allowAppeal': true, //should i make this configurable if appealable?
					'seen': false
				};
 				await Bans.insertOne(ban);
				const bans = await Bans.find(res.locals.ip.hash, res.locals.board._id); //need to query db so it has _id field for unban checkmark
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
					'message': `Mime type ${req.files.file[i].mimetype} for "${req.files.file[i].name}" not allowed.`,
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
					filename: file.filename,
					originalFilename: file.name,
					mimetype: file.mimetype,
					size: file.size,
					extension,
					thumbextension: thumbExtension,
			};

			await Files.increment(processedFile);

			//check if already exists
			const existsFull = await pathExists(`${uploadDirectory}/img/${processedFile.filename}`);
			const existsThumb = await pathExists(`${uploadDirectory}/img/thumb-${processedFile.hash}${processedFile.thumbextension}`);

			//handle video/image ffmpeg or graphicsmagick
			switch (processedFile.mimetype.split('/')[0]) {
				case 'image':
					const imageData = await imageIdentify(req.files.file[i].tempFilePath, null, true);
					processedFile.geometry = imageData.size // object with width and height pixels
					processedFile.sizeString = formatSize(processedFile.size) // 123 Ki string
					processedFile.geometryString = imageData.Geometry // 123 x 123 string
					processedFile.hasThumb = !(fileCheckMimeType(file.mimetype, {image: true})
						&& processedFile.geometry.height <= thumbSize
						&& processedFile.geometry.width <= thumbSize);
					if (!existsFull) {
						await imageUpload(file, processedFile.filename, 'img');
					}
					if (!existsThumb && processedFile.hasThumb) {
						await imageThumbnail(processedFile);
					}
					processedFile = fixGifs(processedFile);
					break;
				case 'video':
					//video metadata
					const videoData = await videoIdentify(req.files.file[i].tempFilePath, null, true);
					videoData.streams = videoData.streams.filter(stream => stream.width != null); //filter to only video streams or something with a resolution
					if (videoData.streams.length <= 0) {
						await deleteTempFiles(req).catch(e => console.error);
						return dynamicResponse(req, res, 400, 'message', {
							'title': 'Bad request',
							'message': 'Audio only file not supported (yet)',
							'redirect': redirect
						});
					}
					processedFile.duration = videoData.format.duration;
					processedFile.durationString = new Date(videoData.format.duration*1000).toLocaleString('en-US', {hour12:false}).split(' ')[1].replace(/^00:/, '');//break for over 24h video
					processedFile.geometry = {width: videoData.streams[0].coded_width, height: videoData.streams[0].coded_height} // object with width and height pixels
					processedFile.sizeString = formatSize(processedFile.size) // 123 Ki string
					processedFile.geometryString = `${processedFile.geometry.width}x${processedFile.geometry.height}` // 123 x 123 string
					processedFile.hasThumb = true;
					if (!existsFull) {
						await videoUpload(file, processedFile.filename, 'img');
					}
					if (!existsThumb) {
						await videoThumbnail(processedFile, processedFile.geometry);
					}
					break;
				default:
					throw new Error(`invalid file mime type: ${processedFile}`); //throw so goes to error handler before next'ing
			}

			if (processedFile.hasThumb === true) {
				const ratio = processedFile.geometry.width/processedFile.geometry.height;
				if (ratio >= 1) {
					processedFile.geometry.thumbwidth = thumbSize;
					processedFile.geometry.thumbheight = Math.ceil(thumbSize/ratio);
				} else {
					processedFile.geometry.thumbwidth = Math.ceil(thumbSize*ratio);
					processedFile.geometry.thumbheight = thumbSize;
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
				if (type.toLowerCase() !== groups.capcode.toLowerCase()) {
					capcode = `##${type} ${groups.capcode}`;
				} else {
					capcode = `##${type}`;
				}
			}
		}
	}

	//simple markdown and sanitize
	let message = req.body.message;
	let quotes = [];
	let crossquotes = [];
	if (message && message.length > 0) {
		message = escape(message);
		message = simpleMarkdown(message);
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
	if (!data.thread //if this is a new thread
		&& tphTriggerAction > 0 //and the triger mode is not nothing
		&& ((tphTriggerAction < 3 && captchaMode < tphTriggerAction) //and captcha mode less than captcha trigger
			|| (tphTriggerAction === 3 && locked !== true))) { //and not locked with lock trigger
		const pastHourMongoId = Mongo.ObjectId.createFromTime(Math.floor((Date.now() - msTime.hour)/1000));
		//count threads in past hour
		const hourPosts = await Stats.getHourPosts(res.locals.board._id);
		//if its above the trigger
		if (hourPosts && hourPosts.tph && hourPosts.tph >= tphTrigger) { //TODO: add an option to check pph OR tph, not just tph
			//update in memory for other stuff done e.g. rebuilds
			const update = {
				'$set': {}
			};
			if (tphTriggerAction < 3) {
				res.locals.board.settings.captchaMode = tphTriggerAction;
				update['$set']['settings.captchaMode'] = tphTriggerAction;
				enableCaptcha = true;
			}
			if (tphTriggerAction === 3) {
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
		await deletePosts(cyclicOverflowPosts, req.params.board);
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
