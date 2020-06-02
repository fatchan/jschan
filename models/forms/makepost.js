'use strict';

const path = require('path')
	, { createHash, randomBytes } = require('crypto')
	, { remove, pathExists } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, Mongo = require(__dirname+'/../../db/db.js')
	, Socketio = require(__dirname+'/../../socketio.js')
	, { Stats, Posts, Boards, Files, Bans } = require(__dirname+'/../../db/')
	, cache = require(__dirname+'/../../redis.js')
	, nameHandler = require(__dirname+'/../../helpers/posting/name.js')
	, messageHandler = require(__dirname+'/../../helpers/posting/message.js')
	, moveUpload = require(__dirname+'/../../helpers/files/moveupload.js')
	, mimeTypes = require(__dirname+'/../../helpers/files/mimetypes.js')
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
	, { thumbSize, thumbExtension, postPasswordSecret, strictFiltering } = require(__dirname+'/../../configs/main.js')
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
	const { filterBanDuration, filterMode, filters, blockedCountries,
			maxFiles, sageOnlyEmail, forceAnon, replyLimit, disableReplySubject,
			threadLimit, ids, userPostSpoiler, pphTrigger, tphTrigger, triggerAction,
			captchaMode, lockMode, allowedFileTypes, flags } = res.locals.board.settings;
	if (flags === true
		&& res.locals.permLevel >= 4
		&& req.headers['x-country-code']
		&& blockedCountries.includes(req.headers['x-country-code'])) {
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': `Your country code ${req.headers['x-country-code']} is not allowed to post on this board`,
			'redirect': redirect
		});
	}
	if ((lockMode === 2 || (lockMode === 1 && !req.body.thread)) //if board lock, or thread lock and its a new thread
		&& res.locals.permLevel >= 4) { //and not staff
		await deleteTempFiles(req).catch(e => console.error);
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'message': lockMode === 1 ? 'Thread creation locked' : 'Board locked',
			'redirect': redirect
		});
	}
	if (req.body.thread) {
		thread = await Posts.getPost(req.params.board, req.body.thread, true);
		if (!thread || thread.thread != null) {
			await deleteTempFiles(req).catch(e => console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': 'Bad request',
				'message': 'Thread does not exist',
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
		const globalSettings = await cache.get('globalsettings');
		let hitGlobalFilter = false
			, hitLocalFilter = false
			, ban;
		let concatContents = `|${req.body.name}|${req.body.message}|${req.body.subject}|${req.body.email}|${res.locals.numFiles > 0 ? req.files.file.map(f => f.name).join('|') : ''}`.toLowerCase();
		let allContents = concatContents;
		if (strictFiltering || res.locals.board.settings.strictFiltering) { //strict filtering adds a few transformations of the text to try and match filters when sers use techniques like zalgo, ZWS, markdown, multi-line, etc.
			allContents += concatContents.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); //removing diacritics
			allContents += concatContents.replace(/[\u200B-\u200D\uFEFF]/g, ''); //removing ZWS
			allContents += concatContents.replace(/[^a-zA-Z0-9.-]+/gm, ''); //removing anything thats not alphamnumeric or . and -
		}
		//global filters
		if (globalSettings && globalSettings.filters.length > 0 && globalSettings.filterMode > 0) {
			hitGlobalFilter = globalSettings.filters.some(filter => { return allContents.includes(filter.toLowerCase()) });
		}
		//board-specific filters (doesnt use strict filtering)
		if (!hitGlobalFilter && res.locals.permLevel >= 4 && filterMode > 0 && filters && filters.length > 0) {
			const localFilterContents = res.locals.board.settings.strictFiltering ? allContents : concatContents;
			hitLocalFilter = filters.some(filter => { return localFilterContents.includes(filter.toLowerCase()) });
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
					'ip': {
						'single': res.locals.ip.single,
						'raw': res.locals.ip.raw,
					},
					'subnet': '/32',
					'reason': `${hitGlobalFilter ? 'global ' :''}word filter auto ban`,
					'board': banBoard,
					'posts': null,
					'issuer': 'system', //what should i call this
					'date': banDate,
					'expireAt': banExpiry,
					'allowAppeal': true, //should i make this configurable if appealable?
					'seen': false
				};
				const insertedResult = await Bans.insertOne(ban);
				ban._id = insertedResult.insertedId;
				return res.status(403).render('ban', {
					bans: [ban]
				});
			}
		}

	}
	let files = [];
	// if we got a file
	if (res.locals.numFiles > 0) {
		// check all mime types befoer we try saving anything
		for (let i = 0; i < res.locals.numFiles; i++) {
			if (!mimeTypes.allowed(req.files.file[i].mimetype, allowedFileTypes)) {
				await deleteTempFiles(req).catch(e => console.error);
				return dynamicResponse(req, res, 400, 'message', {
					'title': 'Bad request',
					'message': `Mime type "${req.files.file[i].mimetype}" for "${req.files.file[i].name}" not allowed`,
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
				///detect images with opacity for PNG thumbnails, set thumbextension before increment
				imageData = await imageIdentify(req.files.file[i].tempFilePath, null, true);
				if (imageData['Channel Statistics'] && imageData['Channel Statistics']['Opacity']) {//does this depend on GM version or anything?
					const opacityMaximum = imageData['Channel Statistics']['Opacity']['Maximum'];
					if (opacityMaximum !== '0.00 (0.0000)') {
						processedFile.thumbextension = '.png';
					}
				}
			}

			//increment file count
			await Files.increment(processedFile);
			req.files.file[i].inced = true;
			//check if already exists
			const existsFull = await pathExists(`${uploadDirectory}/file/${processedFile.filename}`);
			processedFile.sizeString = formatSize(processedFile.size)

			if (mimeTypes.other.has(processedFile.mimetype)) {
				//"other" mimes from config, overrides main type to avoid codec issues in browser or ffmpeg for unsupported filetypes
				processedFile.hasThumb = false;
				processedFile.attachment = true;
				if (!existsFull) {
					await moveUpload(file, processedFile.filename, 'file');
				}
			} else {
				switch (type) {
					case 'image': {
						const existsThumb = await pathExists(`${uploadDirectory}/file/thumb-${processedFile.hash}${processedFile.thumbextension}`);
						processedFile.geometry = imageData.size ;
						processedFile.geometryString = imageData.Geometry;
						processedFile.hasThumb = !(mimeTypes.allowed(file.mimetype, {image: true})
							&& subtype !== 'png'
							&& processedFile.geometry.height <= thumbSize
							&& processedFile.geometry.width <= thumbSize);
						if (!existsFull) {
							await moveUpload(file, processedFile.filename, 'file');
						}
						if (!existsThumb && processedFile.hasThumb) {
							await imageThumbnail(processedFile);
						}
						processedFile = fixGifs(processedFile);
						break;
					}
					case 'video': {
						const existsThumb = await pathExists(`${uploadDirectory}/file/thumb-${processedFile.hash}${processedFile.thumbextension}`);
						//video metadata
						const videoData = await ffprobe(req.files.file[i].tempFilePath, null, true);
						videoData.streams = videoData.streams.filter(stream => stream.width != null); //filter to only video streams or something with a resolution
						if (videoData.streams.length <= 0) {
							//corrupt, or audio only?
							await deleteTempFiles(req).catch(e => console.error);
							return dynamicResponse(req, res, 400, 'message', {
								'title': 'Bad request',
								'message': 'Audio only video file not supported',
								'redirect': redirect
							});
						}
						processedFile.duration = videoData.format.duration;
						processedFile.durationString = timeUtils.durationString(videoData.format.duration*1000);
						processedFile.geometry = {width: videoData.streams[0].coded_width, height: videoData.streams[0].coded_height};
						processedFile.geometryString = `${processedFile.geometry.width}x${processedFile.geometry.height}`
						processedFile.hasThumb = true;
						if (!existsFull) {
							await moveUpload(file, processedFile.filename, 'file');
						}
						if (!existsThumb) {
							await videoThumbnail(processedFile, processedFile.geometry, videoData.streams[0].nb_frames);
						}
						break;
					}
					case 'audio': {
						//audio metadata
						const audioData = await ffprobe(req.files.file[i].tempFilePath, null, true);
						processedFile.duration = audioData.format.duration;
						processedFile.durationString = timeUtils.durationString(audioData.format.duration*1000);
						processedFile.hasThumb = false;
						if (!existsFull) {
							await moveUpload(file, processedFile.filename, 'file');
						}
						break;
					}
					default:
						throw new Error(`invalid file mime type: ${processedFile}`);
				}
			}

			if (processedFile.hasThumb === true) {
				if (processedFile.geometry.width < thumbSize && processedFile.geometry.height < thumbSize) {
					//dont scale up thumbnail for smaller images
					processedFile.geometry.thumbwidth = processedFile.geometry.width;
					processedFile.geometry.thumbheight = processedFile.geometry.height;
				} else {
					const ratio = Math.min(thumbSize/processedFile.geometry.width, thumbSize/processedFile.geometry.height);
					processedFile.geometry.thumbwidth = Math.floor(Math.min(processedFile.geometry.width*ratio, thumbSize));
					processedFile.geometry.thumbheight = Math.floor(Math.min(processedFile.geometry.height*ratio, thumbSize));
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
		const fullUserIdHash = createHash('sha256').update(salt + res.locals.ip.single).digest('hex');
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
	if (req.body.postpassword) {
		password = createHash('sha256').update(postPasswordSecret + req.body.postpassword).digest('base64');
	}


	//spoiler files only if board settings allow
	const spoiler = userPostSpoiler && req.body.spoiler ? true : false;

	//forceanon hide reply subjects so cant be used as name for replies
	//forceanon and sageonlyemail only allow sage email
	let subject = (res.locals.permLevel >= 4 && req.body.thread && (disableReplySubject || forceAnon)) ? null : req.body.subject;
	let email = (res.locals.permLevel < 4 || (!forceAnon && !sageOnlyEmail) || req.body.email === 'sage') ? req.body.email : null;

	//get name, trip and cap
	const { name, tripcode, capcode } = await nameHandler(req.body.name, res.locals.permLevel, res.locals.board.settings);
	//get message, quotes and crossquote array
	const { message, quotes, crossquotes } = await messageHandler(req.body.message, req.params.board, req.body.thread);

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
	if (triggerAction > 0 //if trigger is enabled
		&& (tphTrigger > 0 || pphTrigger > 0) //and has a threshold > 0
		&& ((triggerAction < 3 && captchaMode < triggerAction) //and its triggering captcha and captcha isnt on
			|| (triggerAction === 3 && lockMode < 1) //or triggering locking and board isnt locked
			|| (triggerAction === 4 && lockMode < 2))) {
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
				res.locals.board.settings.lockMode = 1;
				update['$set']['settings.lockMode'] = 1;
			} else if (triggerAction === 4) {
				res.locals.board.settings.lockMode = 2;
				update['$set']['settings.lockMode'] = 2;
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
			const fileCount = cyclicOverflowPosts.reduce((acc, post) => {
				return acc + (post.files ? post.files.length : 0);
			}, 0);
			//reduce amount counted in post by number of posts deleted
			await Posts.db.updateOne({
				'postId': thread.postId,
				'board': res.locals.board._id
			}, {
				'$inc': { //negative increment
					'replyposts': -cyclicOverflowPosts.length,
					'replyfiles': -fileCount
				}
			});
		}
	}

	const successRedirect = `/${req.params.board}/${req.path.endsWith('/modpost') ? 'manage/' : ''}thread/${req.body.thread || postId}.html#${postId}`;

	const buildOptions = {
		'threadId': data.thread || postId,
		'board': res.locals.board
	};

	if (req.headers['x-using-live'] != null && data.thread) {
		//defer build and post will come live
		res.json({
			'postId': postId,
			'redirect': successRedirect
		});
		buildQueue.push({
			'task': 'buildThread',
			'options': buildOptions
		});
	} else {
		//build immediately and refresh when built
		await buildThread(buildOptions);
		if (req.headers['x-using-xhr'] != null) {
			res.json({
				'postId': postId,
				'redirect': successRedirect
			});
		} else {
			res.redirect(successRedirect);
		}
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
		'task': 'buildCatalog',
		'options': {
			'board': res.locals.board,
		}
	});

}
