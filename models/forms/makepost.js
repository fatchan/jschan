'use strict';

const path = require('path')
	, { createHash, randomBytes } = require('crypto')
	, randomBytesAsync = require('util').promisify(randomBytes)
	, { remove, pathExists, stat: fsStat } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js')
	, Mongo = require(__dirname+'/../../db/db.js')
	, Socketio = require(__dirname+'/../../socketio.js')
	, { Stats, Posts, Boards, Files, Bans } = require(__dirname+'/../../db/')
	, cache = require(__dirname+'/../../redis.js')
	, nameHandler = require(__dirname+'/../../helpers/posting/name.js')
	, { prepareMarkdown } = require(__dirname+'/../../helpers/posting/markdown.js')
	, messageHandler = require(__dirname+'/../../helpers/posting/message.js')
	, moveUpload = require(__dirname+'/../../helpers/files/moveupload.js')
	, mimeTypes = require(__dirname+'/../../helpers/files/mimetypes.js')
	, imageThumbnail = require(__dirname+'/../../helpers/files/imagethumbnail.js')
	, imageIdentify = require(__dirname+'/../../helpers/files/imageidentify.js')
	, videoThumbnail = require(__dirname+'/../../helpers/files/videothumbnail.js')
	, audioThumbnail = require(__dirname+'/../../helpers/files/audiothumbnail.js')
	, ffprobe = require(__dirname+'/../../helpers/files/ffprobe.js')
	, formatSize = require(__dirname+'/../../helpers/files/formatsize.js')
	, deleteTempFiles = require(__dirname+'/../../helpers/files/deletetempfiles.js')
	, fixGifs = require(__dirname+'/../../helpers/files/fixgifs.js')
	, timeUtils = require(__dirname+'/../../helpers/timeutils.js')
	, deletePosts = require(__dirname+'/deletepost.js')
	, spamCheck = require(__dirname+'/../../helpers/checks/spamcheck.js')
	, { checkRealMimeTypes, thumbSize, thumbExtension, videoThumbPercentage,
		postPasswordSecret, strictFiltering, animatedGifThumbnails,
		audioThumbnails } = require(__dirname+'/../../configs/main.js')
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
	const { filterBanDuration, filterMode, filters, blockedCountries, threadLimit, ids, userPostSpoiler,
			lockReset, captchaReset, pphTrigger, tphTrigger, tphTriggerAction, pphTriggerAction,
			maxFiles, sageOnlyEmail, forceAnon, replyLimit, disableReplySubject,
			captchaMode, lockMode, allowedFileTypes, flags, fileR9KMode, messageR9KMode } = res.locals.board.settings;
	if (res.locals.permLevel >= 4
		&& res.locals.country
		&& blockedCountries.includes(res.locals.country.code)) {
		return dynamicResponse(req, res, 403, 'message', {
			'title': 'Forbidden',
			'message': `Your country "${res.locals.country.name}" is not allowed to post on this board`,
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
					'type': 'single',
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

	//for r9k messages. usually i wouldnt process these if its not enabled e.g. flags and IDs but in this case I think its necessary
	let messageHash = null;
	if (req.body.message && req.body.message.length > 0) {
		const noQuoteMessage = req.body.message.replace(/>>\d+/g, '').replace(/>>>\/\w+(\/\d*)?/gm, '').trim();
		messageHash = createHash('sha256').update(noQuoteMessage).digest('base64');
		if (res.locals.permLevel >= 4 && (req.body.thread && messageR9KMode === 1) || messageR9KMode === 2) {
			const postWithExistingMessage = await Posts.checkExistingMessage(res.locals.board._id, (messageR9KMode === 2 ? null : req.body.thread), messageHash);
			if (postWithExistingMessage != null) {
				await deleteTempFiles(req).catch(e => console.error);
				return dynamicResponse(req, res, 409, 'message', {
					'title': 'Conflict',
					'message': `Messages must be unique ${messageR9KMode === 1 ? 'in this thread' : 'on this board'}. Your message is not unique.`,
					'redirect': redirect
				});
			}
		}
	}

	let files = [];
	// if we got a file
	if (res.locals.numFiles > 0) {
		if (res.locals.permLevel >= 4 && (req.body.thread && fileR9KMode === 1) || fileR9KMode === 2) {
			const filesHashes = req.files.file.map(f => f.sha256);
			const postWithExistingFiles = await Posts.checkExistingFiles(res.locals.board._id, (fileR9KMode === 2 ? null : req.body.thread), filesHashes);
			if (postWithExistingFiles != null) {
				await deleteTempFiles(req).catch(e => console.error);
				const conflictingFiles = req.files.file
					.filter(f => postWithExistingFiles.files.some(fx => fx.hash === f.sha256))
					.map(f => f.name)
					.join(', ');
				return dynamicResponse(req, res, 409, 'message', {
					'title': 'Conflict',
					'message': `Uploaded files must be unique ${fileR9KMode === 1 ? 'in this thread' : 'on this board'}.\nAt least the following file${conflictingFiles.length > 1 ? 's are': ' is'} not unique: ${conflictingFiles}`,
					'redirect': redirect
				});
			}
		}
		// check all mime types before we try saving anything
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
		// check for any mismatching supposed mimetypes from the actual file mimetype
		if (checkRealMimeTypes) {
			for (let i = 0; i < res.locals.numFiles; i++) {
				if (!(await mimeTypes.realMimeCheck(req.files.file[i]))) {
					deleteTempFiles(req).catch(e => console.error);
					return dynamicResponse(req, res, 400, 'message', {
						'title': 'Bad request',
						'message': `Mime type mismatch for file "${req.files.file[i].name}"`,
						'redirect': redirect
					});
				}
			}
		}
		// then upload, thumb, get metadata, etc.
		for (let i = 0; i < res.locals.numFiles; i++) {
			const file = req.files.file[i];
			let extension = path.extname(file.name) || file.name.substring(file.name.indexOf('.'));
			file.filename = file.sha256 + extension;

			//get metadata
			let processedFile = {
				spoiler: (res.locals.permLevel >= 4 || userPostSpoiler) && req.body.spoiler && req.body.spoiler.includes(file.name),
				hash: file.sha256,
				filename: file.filename, //could probably remove since we have hash and extension
				originalFilename: req.body.strip_filename && req.body.strip_filename.includes(file.name) ? file.filename : file.name,
				mimetype: file.mimetype,
				size: file.size,
				extension,
			};

			//type and subtype
			const [type, subtype] = processedFile.mimetype.split('/');
			let imageData;
			let firstFrameOnly = true;
			if (type === 'image') {
				processedFile.thumbextension = thumbExtension;

				///detect images with opacity for PNG thumbnails, set thumbextension before increment
				try {
					imageData = await imageIdentify(req.files.file[i].tempFilePath, null, true);
				} catch (e) {
					await deleteTempFiles(req).catch(e => console.error);
					return dynamicResponse(req, res, 400, 'message', {
						'title': 'Bad request',
						'message': `The server failed to process "${req.files.file[i].name}". Possible unsupported or corrupt file.`,
						'redirect': redirect
					});
				}

				if (imageData['Channel Statistics'] && imageData['Channel Statistics']['Opacity']) {//does this depend on GM version or anything?
					const opacityMaximum = imageData['Channel Statistics']['Opacity']['Maximum'];
					if (opacityMaximum !== '0.00 (0.0000)') {
						processedFile.thumbextension = '.png';
					}
				}
				processedFile.geometry = imageData.size;
				processedFile.geometryString = imageData.Geometry;
				const lteThumbSize = (processedFile.geometry.height <= thumbSize
					&& processedFile.geometry.width <= thumbSize);
				processedFile.hasThumb = !(mimeTypes.allowed(file.mimetype, {image: true})
					&& subtype !== 'png'
					&& lteThumbSize);
				if (processedFile.hasThumb //if it needs thumbnailing
					&& (!lteThumbSize //and its big enough
					&& file.mimetype === 'image/gif' //and its a gif
					&& (imageData['Delay'] != null || imageData['Iterations'] != null) //and its not a static gif (naive check)
					&& animatedGifThumbnails === true)) { //and animated thumbnails for gifs are enabled
					firstFrameOnly = false;
					processedFile.thumbextension = '.gif';
				}
			} else if (type === 'audio') {
				if (audioThumbnails) {
					// waveform has a transparent background, so force png
					processedFile.thumbextension = '.png';
				}
			} else {
				processedFile.thumbextension = thumbExtension;
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
				const existsThumb = await pathExists(`${uploadDirectory}/file/thumb-${processedFile.hash}${processedFile.thumbextension}`);
				switch (type) {
					case 'image': {
						if (!existsFull) {
							await moveUpload(file, processedFile.filename, 'file');
						}
						if (!existsThumb) {
							await imageThumbnail(processedFile, firstFrameOnly);
						}
						processedFile = fixGifs(processedFile);
						break;
					}
					case 'video': {
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
							const numFrames = videoData.streams[0].nb_frames;
							if (numFrames === 'N/A' && subtype === 'webm') {
								await videoThumbnail(processedFile, processedFile.geometry, videoThumbPercentage+'%');
								let videoThumbStat = null;
								try {
									videoThumbStat = await fsStat(`${uploadDirectory}/file/thumb-${processedFile.hash}${processedFile.thumbextension}`);
								} catch (err) { /*ENOENT, the thumb failed to create. No need to handle this.*/	}
								if (!videoThumbStat || videoThumbStat.size === 0) {
									await videoThumbnail(processedFile, processedFile.geometry, 0);
								}
							} else {
								await videoThumbnail(processedFile, processedFile.geometry, ((numFrames === 'N/A' || numFrames <= 1) ? 0 : videoThumbPercentage+'%'));
							}
						}
						break;
					}
					case 'audio': {
						//audio metadata
						const audioData = await ffprobe(req.files.file[i].tempFilePath, null, true);
						processedFile.duration = audioData.format.duration;
						processedFile.durationString = timeUtils.durationString(audioData.format.duration*1000);
						processedFile.hasThumb = audioThumbnails;
						if (!existsFull) {
							await moveUpload(file, processedFile.filename, 'file');
						}
						if (audioThumbnails && !existsThumb) {
							await audioThumbnail(processedFile);
							// audio thumbnail is always thumbSize x thumbSize
							processedFile.geometry = {
								thumbWidth: thumbSize, thumbHeight: thumbSize,
							};
						}
						break;
					}
					default:
						throw new Error(`invalid file mime type: ${processedFile}`);
				}
			}

			if (processedFile.hasThumb === true && type !== 'audio') {
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
		salt = (await randomBytesAsync(128)).toString('base64');
	}
	if (ids === true) {
//		if (res.locals.tor) {
//			userId = '000000';
//		} else {
			const fullUserIdHash = createHash('sha256').update(salt + res.locals.ip.raw).digest('hex');
			userId = fullUserIdHash.substring(fullUserIdHash.length-6);
//		}
	}
	let country = null;
	if (flags === true) {
		country = res.locals.country;
	}
	let password = null;
	if (req.body.postpassword) {
		password = createHash('sha256').update(postPasswordSecret + req.body.postpassword).digest('base64');
	}

	//spoiler files only if board settings allow
	const spoiler = (res.locals.permLevel >= 4 || userPostSpoiler) && req.body.spoiler_all ? true : false;

	//forceanon hide reply subjects so cant be used as name for replies
	//forceanon and sageonlyemail only allow sage email
	let subject = (res.locals.permLevel >= 4 && req.body.thread && (disableReplySubject || forceAnon)) ? null : req.body.subject;
	let email = (res.locals.permLevel < 4 || (!forceAnon && !sageOnlyEmail) || req.body.email === 'sage') ? req.body.email : null;

	//get name, trip and cap
	const { name, tripcode, capcode } = await nameHandler(req.body.name, res.locals.permLevel,
		res.locals.board.settings, res.locals.board.owner, res.locals.user ? res.locals.user.username : null);
	//get message, quotes and crossquote array
	const nomarkup = prepareMarkdown(req.body.message, true);
	const { message, quotes, crossquotes } = await messageHandler(nomarkup, req.params.board, req.body.thread);

	//build post data for db. for some reason all the property names are lower case :^)
	const data = {
		'date': new Date(),
		name,
		country,
		'board': req.params.board,
		tripcode,
		capcode,
		subject,
		'message': message || null,
		'messagehash': messageHash || null,
		'nomarkup': nomarkup || null,
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

	let enableCaptcha = false; //make this returned from some function, refactor and move the next section to another file
	const pphTriggerActive = (pphTriggerAction > 0 && pphTrigger > 0);
	const tphTriggerActive = (tphTriggerAction > 0 && tphTrigger > 0);
	if (pphTriggerAction || tphTriggerActive) { //if a trigger is enabled
		const triggerUpdate = {
			'$set': {},
		};
		//and a setting needs to be updated
		const pphTriggerUpdate = (pphTriggerAction < 3 && captchaMode < pphTriggerAction)
			|| (pphTriggerAction === 3 && lockMode < 1)
			|| (pphTriggerAction === 4 && lockMode < 2);
		const tphTriggerUpdate = (tphTriggerAction < 3 && captchaMode < tphTriggerAction)
			|| (tphTriggerAction === 3 && lockMode < 1)
			|| (tphTriggerAction === 4 && lockMode < 2);
		if (tphTriggerUpdate || pphTriggerUpdate) {
			const hourPosts = await Stats.getHourPosts(res.locals.board._id);
			const calcTriggerMode = (update, trigger, triggerAction, stat) => { //todo: move this somewhere else
				if (trigger > 0 && stat >= trigger) {
					//update in memory for other stuff done e.g. rebuilds
					if (triggerAction < 3) {
						res.locals.board.settings.captchaMode = triggerAction;
						update['$set']['settings.captchaMode'] = triggerAction;
						enableCaptcha = true; //todo make this also returned after moving/refactoring this
					} else {
						res.locals.board.settings.lockMode = triggerAction-2;
						update['$set']['settings.lockMode'] = triggerAction-2;
					}
					return true;
				}
				return false;
			}
			const updatedPphTrigger = pphTriggerUpdate && calcTriggerMode(triggerUpdate, pphTrigger, pphTriggerAction, hourPosts.pph);
			const updatedTphTrigger = tphTriggerUpdate && calcTriggerMode(triggerUpdate, tphTrigger, tphTriggerAction, hourPosts.tph);
			if (updatedPphTrigger || updatedTphTrigger) {
				//set it in the db
				await Boards.updateOne(res.locals.board._id, triggerUpdate);
				await cache.sadd('triggered', res.locals.board._id);
			}
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
