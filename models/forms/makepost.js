'use strict';

const { createHash, randomBytes } = require('crypto')
	, randomBytesAsync = require('util').promisify(randomBytes)
	, { remove, emptyDir, pathExists, stat: fsStat } = require('fs-extra')
	, uploadDirectory = require(__dirname+'/../../lib/file/uploaddirectory.js')
	, Mongo = require(__dirname+'/../../db/db.js')
	, Socketio = require(__dirname+'/../../lib/misc/socketio.js')
	, { Stats, Posts, Boards, Files, Filters, NftRules } = require(__dirname+'/../../db/')
	, cache = require(__dirname+'/../../lib/redis/redis.js')
	, nameHandler = require(__dirname+'/../../lib/post/name.js')
	, getFilterStrings = require(__dirname+'/../../lib/post/getfilterstrings.js')
	, checkFilters = require(__dirname+'/../../lib/post/checkfilters.js')
	, filterActions = require(__dirname+'/../../lib/post/filteractions.js')
	, { prepareMarkdown, linkRegex } = require(__dirname+'/../../lib/post/markdown/markdown.js')
	, messageHandler = require(__dirname+'/../../lib/post/message.js')
	, moveUpload = require(__dirname+'/../../lib/file/moveupload.js')
	, mimeTypes = require(__dirname+'/../../lib/file/mimetypes.js')
	, imageThumbnail = require(__dirname+'/../../lib/file/image/imagethumbnail.js')
	, getDimensions = require(__dirname+'/../../lib/file/image/getdimensions.js')
	, videoThumbnail = require(__dirname+'/../../lib/file/video/videothumbnail.js')
	, audioThumbnail = require(__dirname+'/../../lib/file/audio/audiothumbnail.js')
	, ffprobe = require(__dirname+'/../../lib/file/ffprobe.js')
	, formatSize = require(__dirname+'/../../lib/converter/formatsize.js')
	, { getCountryName } = require(__dirname+'/../../lib/misc/countries.js')
	, deleteTempFiles = require(__dirname+'/../../lib/file/deletetempfiles.js')
	, fixGifs = require(__dirname+'/../../lib/file/image/fixgifs.js')
	, timeUtils = require(__dirname+'/../../lib/converter/timeutils.js')
	, { Permissions } = require(__dirname+'/../../lib/permission/permissions.js')
	, deletePosts = require(__dirname+'/deletepost.js')
	, spamCheck = require(__dirname+'/../../lib/middleware/misc/spamcheck.js')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, { postPasswordSecret } = require(__dirname+'/../../configs/secrets.js')
	, buildQueue = require(__dirname+'/../../lib/build/queue.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, { buildThread } = require(__dirname+'/../../lib/build/tasks.js')
	, { hasNftFromCollection, checkNftOwnership, asNftMissingLabel } = require(__dirname+'/../../lib/web3/web3.js')
	, FIELDS_TO_REPLACE = ['email', 'subject', 'message'];

module.exports = async (req, res) => {

	const { __ } = res.locals;
	const { checkRealMimeTypes, thumbSize, thumbExtension, videoThumbPercentage, audioThumbnails,
		dontStoreRawIps, globalLimits } = config.get;

	//spam/flood check
	const flood = await spamCheck(req, res);
	if (flood) {
		deleteTempFiles(req).catch(console.error);
		return dynamicResponse(req, res, 429, 'message', {
			'title': __('Flood detected'),
			'message': __('Please wait before making another post, or a post similar to another user'),
			'redirect': `/${req.params.board}${req.body.thread ? '/thread/' + req.body.thread + '.html' : ''}`
		});
	}

	// check if this is responding to an existing thread
	let redirect = `/${req.params.board}/`;
	let salt = null;
	let thread = null;
	const isStaffOrGlobal = res.locals.permissions.hasAny(Permissions.MANAGE_GLOBAL_GENERAL, Permissions.MANAGE_BOARD_GENERAL);
	const { blockedCountries, threadLimit, ids, userPostSpoiler,
		pphTrigger, tphTrigger, tphTriggerAction, pphTriggerAction,
		sageOnlyEmail, forceAnon, replyLimit, disableReplySubject,
		captchaMode, lockMode, allowedFileTypes, customFlags, geoFlags, fileR9KMode, messageR9KMode } = res.locals.board.settings;
	if (!isStaffOrGlobal
		// && !res.locals.permissions.get(Permissions.BYPASS_FILTERS) //TODO: new permission for "bypass blocks" or something
		&& res.locals.country
		&& blockedCountries.includes(res.locals.country.code)) {
		await deleteTempFiles(req).catch(console.error);
		return dynamicResponse(req, res, 403, 'message', {
			'title': __('Forbidden'),
			'message': __('Your country "%s" is not allowed to post on this board', getCountryName(res.locals.country.code, res.locals.locale)),
			'redirect': redirect
		});
	}
	if ((lockMode === 2 || (lockMode === 1 && !req.body.thread)) //if board lock, or thread lock and its a new thread
		&& !isStaffOrGlobal) { //and not staff
		await deleteTempFiles(req).catch(console.error);
		return dynamicResponse(req, res, 400, 'message', {
			'title': __('Bad request'),
			'message': __(lockMode === 1 ? 'Thread creation locked' : 'Board locked'),
			'redirect': redirect
		});
	}
	if (req.body.thread) {
		thread = await Posts.getPost(req.params.board, req.body.thread, true);
		if (!thread || thread.thread != null) {
			await deleteTempFiles(req).catch(console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'message': __('Thread does not exist'),
				'redirect': redirect
			});
		}
		salt = thread.salt;
		redirect += `thread/${req.body.thread}.html`;
		if (thread.locked && !isStaffOrGlobal) {
			await deleteTempFiles(req).catch(console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'message': __('Thread locked'),
				'redirect': redirect
			});
		}
		if (thread.replyposts >= replyLimit && !thread.cyclic) { //reply limit
			await deleteTempFiles(req).catch(console.error);
			return dynamicResponse(req, res, 400, 'message', {
				'title': __('Bad request'),
				'message': __('Thread reached reply limit'),
				'redirect': redirect
			});
		}
	}

	let	nftsRequired = false,
		nftRules,
		nftReplies,
		nftThreads,
		nftFiles,
		nftLinks;
	if (res.locals.board.settings.enableWeb3) {
		//get nft rules if web3 enabled
		nftRules = await NftRules.findForBoard(req.params.board);
		if (nftRules && nftRules.length > 0) {
			nftsRequired = true;
			const userAddress = res.locals.recoveredAddress;
			nftRules = await Promise.all(nftRules.map(async (rule) => {
				//check if the user has passed any/all
				const { network, contractAddress, abi, tokenId } = rule;
				const parsedAbi = JSON.parse(abi);
				if (!tokenId) {
					rule.passed = await hasNftFromCollection(network, contractAddress, parsedAbi, userAddress);
				} else {
					rule.passed = await checkNftOwnership(network, contractAddress, parsedAbi, userAddress, tokenId);
				}
				return rule;
			}));
			nftRules.filter(x => x.passed)
				.forEach(rule => {
					//set the flags (or)
					nftReplies = nftReplies || rule.permissions.reply;
					nftThreads = nftThreads || rule.permissions.thread;
					nftFiles = nftFiles || rule.permissions.file;
					nftLinks = nftLinks || rule.permissions.link;
				});
		}
	}

	if (nftsRequired && !isStaffOrGlobal) {
		if (!req.body.thread && !nftThreads) {
			await deleteTempFiles(req).catch(console.error);
			return dynamicResponse(req, res, 403, 'message', {
				'title': __('Forbidden'),
				'message': __('You dont have the NFT(s) required to create threads on this board:\n%s', nftRules.filter(x => !x.passed && x.permission.thread).map(asNftMissingLabel).join('\n')),
				'redirect': redirect
			});
		} else if (req.body.thread && !nftReplies) {
			await deleteTempFiles(req).catch(console.error);
			return dynamicResponse(req, res, 403, 'message', {
				'title': __('Forbidden'),
				'message': __('You dont have the NFT(s) required to make replies on this board:\n%s', nftRules.filter(x => !x.passed && x.permission.reply).map(asNftMissingLabel).join('\n')),
				'redirect': redirect
			});
		}
	}

	//filters
	if (!res.locals.permissions.get(Permissions.BYPASS_FILTERS)) {

		//deconstruct global filter settings to differnt names, else they would conflict with the respective board-level setting
		const [globalFilters, localFilters] = await Promise.all([
			Filters.findForBoard(null),
			Filters.findForBoard(res.locals.board._id)
		]);

		let hitFilters = false
			, globalFilter = false;
		let { combinedString, strictCombinedString } = getFilterStrings(req, res);

		//compare to global filters
		hitFilters = checkFilters(globalFilters, combinedString, strictCombinedString);
		if (hitFilters) {
			globalFilter = true;
		}
		//if none matched, check local filters
		if (!hitFilters) {
			hitFilters = checkFilters(localFilters, combinedString, strictCombinedString);
		}

		if (hitFilters) {
			//if block or ban matched, only it is returned
			if (hitFilters[0].f.filterMode === 1 || hitFilters[0].f.filterMode === 2) {
				await deleteTempFiles(req).catch(console.error);
				return filterActions(req, res, globalFilter, hitFilters[0].h, hitFilters[0].f, redirect);
			} else {
				for (const o of hitFilters) {
					await filterActions(req, res, globalFilter, o.h, o.f, redirect);
				}

				for (const field of FIELDS_TO_REPLACE) {
					//check filters haven't pushed a field past its limit
					if (req.body[field] && (req.body[field].length > globalLimits.fieldLength[field])) {
						await deleteTempFiles(req).catch(console.error);
						return dynamicResponse(req, res, 400, 'message', {
							'title': __('Bad request'),
							'message': __(`After applying filters, ${field} exceeds maximum length of %s`, globalLimits.fieldLength[field]),
							'redirect': redirect
						});
					}
				}
			}
		}
	}

	// nft check for link posting
	if (nftsRequired && !isStaffOrGlobal && !nftLinks
		&& req.body.message && req.body.message.length > 0
		&& linkRegex.test(req.body.message)) {
		await deleteTempFiles(req).catch(console.error);
		return dynamicResponse(req, res, 403, 'message', {
			'title': __('Forbidden'),
			'message': __('You dont have the NFT(s) required to post links:\n%s', nftRules.filter(x => !x.passed && x.permission.link).map(asNftMissingLabel).join('\n')),
			'redirect': redirect
		});
	}

	//for r9k messages. usually i wouldnt process these if its not enabled e.g. flags and IDs but in this case I think its necessary
	let messageHash = null;
	if (req.body.message && req.body.message.length > 0) {
		const noQuoteMessage = req.body.message.replace(/>>\d+/g, '').replace(/>>>\/\w+(\/\d*)?/gm, '').trim();
		messageHash = createHash('sha256').update(noQuoteMessage).digest('base64');
		if ((req.body.thread && messageR9KMode === 1) || messageR9KMode === 2) {
			const postWithExistingMessage = await Posts.checkExistingMessage(res.locals.board._id, (messageR9KMode === 2 ? null : req.body.thread), messageHash);
			if (postWithExistingMessage != null) {
				await deleteTempFiles(req).catch(console.error);
				return dynamicResponse(req, res, 409, 'message', {
					'title': __('Conflict'),
					'message': __(`Messages must be unique ${messageR9KMode === 1 ? 'in this thread' : 'on this board'}. Your message is not unique.`),
					'redirect': redirect
				});
			}
		}
	}

	let files = [];
	// if we got a file
	if (res.locals.numFiles > 0) {

		if (nftsRequired && !isStaffOrGlobal && !nftFiles) {
			await deleteTempFiles(req).catch(console.error);
			return dynamicResponse(req, res, 403, 'message', {
				'title': __('Forbidden'),
				'message': __('You dont have the NFT(s) required to post files:\n%s', nftRules.filter(x => !x.passed && x.permission.file).map(asNftMissingLabel).join('\n')),
				'redirect': redirect
			});
		}

		//unique files check
		if ((req.body.thread && fileR9KMode === 1) || fileR9KMode === 2) {
			const filesHashes = req.files.file.map(f => f.sha256);
			const postWithExistingFiles = await Posts.checkExistingFiles(res.locals.board._id, (fileR9KMode === 2 ? null : req.body.thread), filesHashes);
			if (postWithExistingFiles != null) {
				await deleteTempFiles(req).catch(console.error);
				const conflictingFiles = req.files.file
					.filter(f => postWithExistingFiles.files.some(fx => fx.hash === f.sha256))
					.map(f => f.name)
					.join(', ');
				const r9kFilesMessage = __(`Uploaded files must be unique ${fileR9KMode === 1 ? 'in this thread' : 'on this board'}.`)
					+ '\n'
					+ conflictingFiles.length > 1 //slightly gross but __mf() is more so
					? __('At least the following file is not unique: %s', conflictingFiles)
					: __('At least the following files are not unique: %s', conflictingFiles);
				return dynamicResponse(req, res, 409, 'message', {
					'title': 'Conflict',
					'message': r9kFilesMessage,
					'redirect': redirect,
				});
			}
		}

		//basic mime type check
		for (let i = 0; i < res.locals.numFiles; i++) {
			if (!mimeTypes.allowed(req.files.file[i].mimetype, allowedFileTypes)) {
				await deleteTempFiles(req).catch(console.error);
				return dynamicResponse(req, res, 400, 'message', {
					'title': __('Bad request'),
					'message': __('Mime type "%s" for "%s" not allowed', req.files.file[i].mimetype, req.files.file[i].name),
					'redirect': redirect
				});
			}
		}

		//validate mime type properly
		if (checkRealMimeTypes) {
			for (let i = 0; i < res.locals.numFiles; i++) {
				if (!(await mimeTypes.realMimeCheck(req.files.file[i]))) {
					deleteTempFiles(req).catch(console.error);
					return dynamicResponse(req, res, 400, 'message', {
						'title': __('Bad request'),
						'message': req.files.file[i].realMimetype
							? __('Mime type "%s" invalid for file "%s"', req.files.file[i].realMimetype, req.files.file[i].name)
							: __('Mime type invalid for file "%s"', req.files.file[i].name),
						'redirect': redirect
					});
				}
			}
		}

		//upload, create thumbnails, get metadata, etc.
		for (let i = 0; i < res.locals.numFiles; i++) {
			const file = req.files.file[i];
			file.filename = file.sha256 + file.extension;

			//get metadata
			let processedFile = {
				filename: file.filename,
				spoiler: (!isStaffOrGlobal || userPostSpoiler) && req.body.spoiler && req.body.spoiler.includes(file.sha256),
				hash: file.sha256,
				originalFilename: req.body.strip_filename && req.body.strip_filename.includes(file.sha256) ? file.filename : file.name,
				mimetype: file.mimetype,
				size: file.size,
				extension: file.extension,
			};

			//phash
			if (file.phash) {
				processedFile.phash = file.phash;
			}

			//type and subtype
			let [type, subtype] = processedFile.mimetype.split('/');
			//check if already exists
			const existsFull = await pathExists(`${uploadDirectory}/file/${processedFile.filename}`);
			processedFile.sizeString = formatSize(processedFile.size);
			const saveFull = async () => {
				await Files.increment(processedFile);
				req.files.file[i].inced = true;
				if (!existsFull) {
					await moveUpload(file, processedFile.filename, 'file');
				}
			};
			if (mimeTypes.getOther().has(processedFile.mimetype)) {
				//"other" mimes from config, overrides main type to avoid codec issues in browser or ffmpeg for unsupported filetypes
				processedFile.hasThumb = false;
				processedFile.attachment = true;
				await saveFull();
			} else {
				const existsThumb = await pathExists(`${uploadDirectory}/file/thumb/${processedFile.hash}${processedFile.thumbextension}`);
				try {
					switch (type) {
						case 'image': {
							processedFile.thumbextension = thumbExtension;
							const imageDimensions = await getDimensions(req.files.file[i].tempFilePath, null, true);
							if (Math.floor(imageDimensions.width*imageDimensions.height) > globalLimits.postFilesSize.imageResolution) {
								await deleteTempFiles(req).catch(console.error);
								return dynamicResponse(req, res, 400, 'message', {
									'title': 'Bad request',
									'message': `File "${req.files.file[i].name}" image resolution is too high. Width*Height must not exceed ${globalLimits.postFilesSize.imageResolution}.`,
									'redirect': redirect
								});
							}
							if (thumbExtension === '.jpg' && subtype === 'png') {
								//avoid transparency issues for jpg thumbnails on pngs (the most common case -- for anything else, use webp thumbExtension)
								processedFile.thumbextension = '.png';
							}
							processedFile.geometry = imageDimensions;
							processedFile.geometryString = `${imageDimensions.width}x${imageDimensions.height}`;
							const lteThumbSize = (processedFile.geometry.height <= thumbSize
								&& processedFile.geometry.width <= thumbSize);
							processedFile.hasThumb = !(mimeTypes.allowed(file.mimetype, {image: true})
								&& subtype !== 'png'
								&& lteThumbSize);
							await saveFull();
							if (!existsThumb) {
								await imageThumbnail(processedFile);
							}
							processedFile = fixGifs(processedFile);
							break;
						}
						case 'audio':
						case 'video': {
							//video metadata
							const audioVideoData = await ffprobe(req.files.file[i].tempFilePath, null, true);
							processedFile.duration = audioVideoData.format.duration;
							processedFile.durationString = timeUtils.durationString(audioVideoData.format.duration*1000);
							const videoStreams = audioVideoData.streams.filter(stream => stream.width != null); //filter to only video streams or something with a resolution
							if (videoStreams.length > 0) {
								processedFile.thumbextension = thumbExtension;
								processedFile.codec = videoStreams[0].codec_name;
								processedFile.geometry = {width: videoStreams[0].coded_width, height: videoStreams[0].coded_height};
								if (Math.floor(processedFile.geometry.width*processedFile.geometry.height) > globalLimits.postFilesSize.videoResolution) {
									await deleteTempFiles(req).catch(console.error);
									return dynamicResponse(req, res, 400, 'message', {
										'title': 'Bad request',
										'message': `File "${req.files.file[i].name}" video resolution is too high. Width*Height must not exceed ${globalLimits.postFilesSize.videoResolution}.`,
										'redirect': redirect
									});
								}
								processedFile.geometryString = `${processedFile.geometry.width}x${processedFile.geometry.height}`;
								processedFile.hasThumb = true;
								await saveFull();
								if (!existsThumb) {
									const numFrames = videoStreams[0].nb_frames;
									const timestamp = ((numFrames === 'N/A' && subtype !== 'webm') || numFrames <= 1) ? 0 : processedFile.duration * videoThumbPercentage / 100;
									try {
										await videoThumbnail(processedFile, processedFile.geometry, timestamp);
									} catch (err) {
										//No keyframe after timestamp probably. ignore, we'll retry
										console.warn(err); //printing log because this error can actually be useful and we dont wanna mask it
									}
									let videoThumbStat = null;
									try {
										videoThumbStat = await fsStat(`${uploadDirectory}/file/thumb/${processedFile.hash}${processedFile.thumbextension}`);
									} catch (err) { /*ENOENT probably, ignore*/ }
									if (!videoThumbStat || videoThumbStat.code === 'ENOENT' || videoThumbStat.size === 0) {
										//create thumb again at 0 timestamp and lets hope it exists this time
										await videoThumbnail(processedFile, processedFile.geometry, 0);
									}
								}
							} else {
								//audio file, or video with only audio streams
								type = 'audio';
								processedFile.mimetype = `audio/${subtype}`;
								processedFile.thumbextension = '.png';
								processedFile.hasThumb = audioThumbnails;
								processedFile.geometry = { thumbwidth: thumbSize, thumbheight: thumbSize };
								await saveFull();
								if (processedFile.hasThumb && !existsThumb) {
									await audioThumbnail(processedFile);
								}
							}
							break;
						}
						default:
							throw new Error(__('invalid file mime type: %s', processedFile.mimetype));
					}
				} catch (e) {
					console.error(e);
					await deleteTempFiles(req).catch(console.error);
					return dynamicResponse(req, res, 400, 'message', {
						'title': __('Bad request'),
						'message': __('The server failed to process "%s". Possible unsupported or corrupt file.', req.files.file[i].name),
						'redirect': redirect
					});
				}
			}

			if (processedFile.hasThumb === true && processedFile.geometry && processedFile.geometry.width != null) {
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
	deleteTempFiles(req).catch(console.error);

	let userId = null;
	if (!salt) {
		//thread salt for IDs
		salt = (await randomBytesAsync(128)).toString('base64');
	}
	if (ids === true) {
		const fullUserIdHash = createHash('sha256').update(salt + res.locals.ip.raw).digest('hex');
		userId = fullUserIdHash.substring(fullUserIdHash.length-6);
	}
	let country = null;
	if (geoFlags === true) {
		country = {
			code: res.locals.country.code,
			name: getCountryName(res.locals.country.code, res.locals.locale),
		};
	}
	if (customFlags === true) {
		if (req.body.customflag && res.locals.board.flags[req.body.customflag] != null) {
			//if customflags allowed, and its a valid selection
			country = {
				name: req.body.customflag,
				code: req.body.customflag,
				src: res.locals.board.flags[req.body.customflag],
				custom: true, //this will help
			};
		}
	}
	let password = null;
	if (req.body.postpassword) {
		password = createHash('sha256').update(postPasswordSecret + req.body.postpassword).digest('base64');
	}

	//spoiler files only if board settings allow
	const spoiler = (!isStaffOrGlobal || userPostSpoiler) && req.body.spoiler_all ? true : false;

	//forceanon and sageonlyemail only allow sage email
	let email = (isStaffOrGlobal || (!forceAnon && !sageOnlyEmail) || req.body.email === 'sage') ? req.body.email : null;
	//disablereplysubject
	let subject = (!isStaffOrGlobal && req.body.thread && disableReplySubject) ? null : req.body.subject;

	//get name, trip and cap
	const { name, tripcode, capcode } = await nameHandler(
		req.body.name,
		res.locals.permissions,
		res.locals.board.settings,
		res.locals.board.owner,
		res.locals.board.staff,
		res.locals.user ? res.locals.user.username : null,
		__ //i18n translation local
	);
	//get message, quotes and crossquote array
	const nomarkup = prepareMarkdown(req.body.message, true);
	const { message, quotes, crossquotes } = await messageHandler(nomarkup, req.params.board, req.body.thread, res.locals.permissions);

	//web3 sig
	let signature = null
		, address = null;
	if (res.locals.recoveredAddress) {
		signature = req.body.signature;
		address = res.locals.recoveredAddress;
	}

	//build post data for db. for some reason all the property names are lower case :^)
	const now = Date.now();
	const data = {
		'date': new Date(now),
		'u': now,
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
		signature,
		address,
		'banmessage': null,
		userId,
		'ip': res.locals.ip,
		files,
		'reports': [],
		'globalreports': [],
		quotes, //posts this post replies to
		crossquotes, //quotes to other threads in same board
		'backlinks': [], //posts replying to this post
	};

	if (!req.body.thread) {
		//if this is a thread, add thread specific properties
		Object.assign(data, {
			'replyposts': 0,
			'replyfiles': 0,
			//NOTE: sticky is a number, 0 = not sticky, higher numbers are a priority and will be sorted in descending order
			'sticky': Mongo.NumberInt(0),
			//NOTE: these are numbers because we XOR them for toggling in action handler
			'locked': Mongo.NumberInt(0),
			'bumplocked': Mongo.NumberInt(0),
			'cyclic': Mongo.NumberInt(0),
			'salt': salt
		});
	}

	let threadPage = null;
	if (data.thread) {
		threadPage = await Posts.getThreadPage(req.params.board, data.thread);
	}

	const { postId, postMongoId } = await Posts.insertOne(res.locals.board, data, thread, res.locals.anonymizer);

	let enableCaptcha = false; //make this returned from some function, refactor and move the next section to another file
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
			};
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
	if (thread && thread.cyclic && thread.replyposts >= replyLimit) {
		const cyclicOverflowPosts = await Posts.db.find({
			'thread': data.thread,
			'board': req.params.board
		}).sort({
			'postId': -1,
		}).skip(replyLimit).toArray();
		if (cyclicOverflowPosts.length > 0) {
			await deletePosts(cyclicOverflowPosts, req.params.board, res.locals);
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

	//let frontend script know if captcha is still enabled
	res.set('x-captcha-enabled', captchaMode > 0);

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

	const projectedPost = {
		'_id': postMongoId,
		'u': data.u,
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
		'signature': data.signature,
		'address': data.address,
	};
	if (data.thread) {
		//dont emit thread to this socket, because the room only exists when the thread is open
		Socketio.emitRoom(`${res.locals.board._id}-${data.thread}`, 'newPost', projectedPost);
	}
	const { raw, cloak, type } = data.ip;
	//but emit it to manage pages because they need to get all posts through socket including thread
	Socketio.emitRoom('globalmanage-recent-hashed', 'newPost', { ...projectedPost, ip: { cloak, raw: null, type } });
	Socketio.emitRoom(`${res.locals.board._id}-manage-recent-hashed`, 'newPost', { ...projectedPost, ip: { cloak, raw: null, type } });
	if (!dontStoreRawIps) {
        //no need to emit to these rooms if raw IPs are not stored
		Socketio.emitRoom('globalmanage-recent-raw', 'newPost', { ...projectedPost, ip: { cloak, raw, type } });
		Socketio.emitRoom(`${res.locals.board._id}-manage-recent-raw`, 'newPost', { ...projectedPost, ip: { cloak, raw, type } });
	}

	//now add other pages to be built in background
	if (enableCaptcha) {
		if (res.locals.board.settings.captchaMode == 2) {
			//only delete threads if all posts require threads, otherwise just build board pages for thread captcha
			await emptyDir(`${uploadDirectory}/html/${req.params.board}/thread/`); //not deleting json cos it doesnt need to be
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
			await deletePosts(prunedThreads, req.params.board, res.locals);
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

};
