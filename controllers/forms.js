'use strict';

const express  = require('express')
	, router = express.Router()
	, Boards = require(__dirname+'/../db/boards.js')
	, Posts = require(__dirname+'/../db/posts.js')
	, Captchas = require(__dirname+'/../db/captchas.js')
	, Trips = require(__dirname+'/../db/trips.js')
	, Bans = require(__dirname+'/../db/bans.js')
	, Mongo = require(__dirname+'/../db/db.js')
	, banPoster = require(__dirname+'/../models/forms/ban-poster.js')
	, removeBans = require(__dirname+'/../models/forms/removebans.js')
	, makePost = require(__dirname+'/../models/forms/make-post.js')
	, uploadBanners = require(__dirname+'/../models/forms/uploadbanners.js')
	, deleteBanners = require(__dirname+'/../models/forms/deletebanners.js')
	, deletePosts = require(__dirname+'/../models/forms/delete-post.js')
	, spoilerPosts = require(__dirname+'/../models/forms/spoiler-post.js')
	, stickyPosts = require(__dirname+'/../models/forms/stickyposts.js')
	, sagePosts = require(__dirname+'/../models/forms/sageposts.js')
	, lockPosts = require(__dirname+'/../models/forms/lockposts.js')
	, deletePostsFiles = require(__dirname+'/../models/forms/deletepostsfiles.js')
	, reportPosts = require(__dirname+'/../models/forms/report-post.js')
	, globalReportPosts = require(__dirname+'/../models/forms/globalreportpost.js')
	, dismissReports = require(__dirname+'/../models/forms/dismiss-report.js')
	, dismissGlobalReports = require(__dirname+'/../models/forms/dismissglobalreport.js')
	, loginAccount = require(__dirname+'/../models/forms/login.js')
	, changePassword = require(__dirname+'/../models/forms/changepassword.js')
	, registerAccount = require(__dirname+'/../models/forms/register.js')
	, checkPermsMiddleware = require(__dirname+'/../helpers/haspermsmiddleware.js')
	, checkPerms = require(__dirname+'/../helpers/hasperms.js')
	, paramConverter = require(__dirname+'/../helpers/paramconverter.js')
	, banCheck = require(__dirname+'/../helpers/bancheck.js')
	, verifyCaptcha = require(__dirname+'/../helpers/captchaverify.js')
	, actionChecker = require(__dirname+'/../helpers/actionchecker.js');

// login to account
router.post('/login', (req, res, next) => {

	const errors = [];

	//check exist
	if (!req.body.username || req.body.username.length <= 0) {
		errors.push('Missing username');
	}
	if (!req.body.password || req.body.password.length <= 0) {
		errors.push('Missing password');
	}

	//check too long
	if (req.body.username && req.body.username.length > 50) {
		errors.push('Username must be 50 characters or less');
	}
	if (req.body.password && req.body.password.length > 100) {
		errors.push('Password must be 100 characters or less');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': '/login'
		})
	}

	loginAccount(req, res, next);

});

//change password
router.post('/changepassword', async (req, res, next) => {

	const errors = [];

	//check exist
	if (!req.body.username || req.body.username.length <= 0) {
		errors.push('Missing username');
	}
	if (!req.body.password || req.body.password.length <= 0) {
		errors.push('Missing password');
	}
	if (!req.body.newpassword || req.body.newpassword.length <= 0) {
		errors.push('Missing new password');
	}
	if (!req.body.newpasswordconfirm || req.body.newpasswordconfirm.length <= 0) {
		errors.push('Missing new password confirmation');
	}

	//check too long
	if (req.body.username && req.body.username.length > 50) {
		errors.push('Username must be 50 characters or less');
	}
	if (req.body.password && req.body.password.length > 100) {
		errors.push('Password must be 100 characters or less');
	}
	if (req.body.newpassword && req.body.newpassword.length > 100) {
		errors.push('Password must be 100 characters or less');
	}
	if (req.body.newpasswordconfirm && req.body.newpasswordconfirm.length > 100) {
		errors.push('Password confirmation must be 100 characters or less');
	}
	if (req.body.newpassword != req.body.newpasswordconfirm) {
		errors.push('New password and password confirmation must match');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': '/changepassword'
		})
	}

	try {
		await changePassword(req, res, next);
	} catch (err) {
		return next(err);
	}

});

//register account
router.post('/register', verifyCaptcha, (req, res, next) => {

	const errors = [];

	//check exist
	if (!req.body.username || req.body.username.length <= 0) {
		errors.push('Missing username');
	}
	if (!req.body.password || req.body.password.length <= 0) {
		errors.push('Missing password');
	}
	if (!req.body.passwordconfirm || req.body.passwordconfirm.length <= 0) {
		errors.push('Missing password confirmation');
	}

	//check too long
	if (req.body.username && req.body.username.length > 50) {
		errors.push('Username must be 50 characters or less');
	}
	if (req.body.password && req.body.password.length > 100) {
		errors.push('Password must be 100 characters or less');
	}
	if (req.body.passwordconfirm && req.body.passwordconfirm.length > 100) {
		errors.push('Password confirmation must be 100 characters or less');
	}
	if (req.body.password != req.body.passwordconfirm) {
		errors.push('Password and password confirmation must match');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': '/register'
		})
	}

	registerAccount(req, res, next);

});

// make new post
router.post('/board/:board/post', Boards.exists, banCheck, paramConverter, verifyCaptcha, async (req, res, next) => {

	let numFiles = 0;
	if (req.files && req.files.file) {
		if (Array.isArray(req.files.file)) {
			numFiles = req.files.file.filter(file => file.size > 0).length;
		} else {
			numFiles = req.files.file.size > 0 ? 1 : 0;
			req.files.file = [req.files.file];
		}
	}

	const errors = [];

	if (!req.body.message && numFiles === 0) {
		errors.push('Must provide a message or file');
	}
	if (req.body.message && req.body.message.length > 2000) {
		errors.push('Message must be 2000 characters or less');
	}
	if (!req.body.thread && (!req.body.message || req.body.message.length === 0)) {
		errors.push('Threads must include a message');
	}
	if (req.body.name && req.body.name.length > 50) {
		errors.push('Name must be 50 characters or less');
	}
	if (req.body.subject && req.body.subject.length > 50) {
		errors.push('Subject must be 50 characters or less');
	}
	if (req.body.email && req.body.email.length > 50) {
		errors.push('Email must be 50 characters or less');
	}
	if (req.body.password && req.body.password.length > 50) {
		errors.push('Password must be 50 characters or less');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}${req.body.thread ? '/thread/' + req.body.thread : ''}`
		})
	}

	makePost(req, res, next, numFiles);

});

//upload banners
router.post('/board/:board/addbanners', Boards.exists, banCheck, checkPermsMiddleware, paramConverter, async (req, res, next) => {

	let numFiles = 0;
	if (req.files && req.files.file) {
		if (Array.isArray(req.files.file)) {
			numFiles = req.files.file.filter(file => file.size > 0).length;
		} else {
			numFiles = req.files.file.size > 0 ? 1 : 0;
			req.files.file = [req.files.file];
		}
	}

	const errors = [];

	if (numFiles === 0) {
		errors.push('Must provide a file');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}/manage`
		})
	}

	try {
		await uploadBanners(req, res, next, numFiles);
	} catch (err) {
		console.error(err);
		return next(err);
	}

});

//delete banners
router.post('/board/:board/deletebanners', Boards.exists, banCheck, checkPermsMiddleware, paramConverter, async (req, res, next) => {

	const errors = [];

	if (!req.body.checkedbanners || req.body.checkedbanners.length === 0 || req.body.checkedbanners.length > 10) {
		errors.push('Must select 1-10 banners to delete');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}/manage`
		})
	}

	for (let i = 0; i < req.body.checkedbanners.length; i++) {
		if (!res.locals.board.banners.includes(req.body.checkedbanners[i])) {
			return res.status(400).render('message', {
				'title': 'Bad request',
				'message': 'Invalid banners selected',
				'redirect': `/${req.params.board}/manage`
			})
		}
	}

	try {
		await deleteBanners(req, res, next);
	} catch (err) {
		console.error(err);
		return next(err);
	}

});

//report/delete/spoiler/ban
router.post('/board/:board/actions', Boards.exists, banCheck, paramConverter, verifyCaptcha, async (req, res, next) => {

	const errors = [];

	//make sure they checked 1-10 posts
	if (!req.body.checkedposts || req.body.checkedposts.length === 0 || req.body.checkedposts.length > 10) {
		errors.push('Must select 1-10 posts');
	}

	//get what type of actions
	const { anyPasswords, anyAuthed, anyValid } = actionChecker(req);

	//make sure they selected at least 1 action
	if (!anyValid) {
		errors.push('No actions selected');
	}
	//check if they have permission to perform the actions
	const hasPerms = checkPerms(req, res);
	if(!hasPerms && anyAuthed) {
		errors.push('No permission');
	}

	//check that actions are valid
	if (req.body.password && req.body.password.length > 50) {
		errors.push('Password must be 50 characters or less');
	}
	if (req.body.report_reason && req.body.report_reason.length > 50) {
		errors.push('Report must be 50 characters or less');
	}
	if (req.body.ban_reason && req.body.ban_reason.length > 50) {
		errors.push('Ban reason must be 50 characters or less');
	}
	if ((req.body.report || req.body.global_report) && (!req.body.report_reason || req.body.report_reason.length === 0)) {
		errors.push('Reports must have a reason');
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}`
		})
	}

	const posts = await Posts.getPosts(req.params.board, req.body.checkedposts, true);
	if (!posts || posts.length === 0) {
		return res.status(404).render('message', {
			'title': 'Not found',
			'error': 'Selected posts not found',
			'redirect': `/${req.params.board}`
		})
	}

	//get the ids
	const postMongoIds = posts.map(post => Mongo.ObjectId(post._id));
	let passwordPostMongoIds = [];
	let passwordPosts = [];
	if (!hasPerms && anyPasswords) {
		//just to avoid multiple filters and mapping, do it all here
		passwordPosts = posts.filter(post => {
			if (post.password != null
				&& post.password.length > 0
				&& post.password == req.body.password) {
				passwordPostMongoIds.push(Mongo.ObjectId(post._id))
				return true;
			}
		});
		if (passwordPosts.length === 0) {
			return res.status(403).render('message', {
				'title': 'Forbidden',
				'error': 'Password did not match any selected posts',
				'redirect': `/${req.params.board}`
			});
		}
	} else {
		passwordPosts = posts;
		passwordPostMongoIds = postMongoIds;
	}

	const messages = [];
	const combinedQuery = {};
	const passwordCombinedQuery = {};
	let aggregateNeeded = false;
	try {
		if (hasPerms) {
			// if getting global banned, board ban doesnt matter
			if (req.body.global_ban) {
				const { message, action, query } = await banPoster(req, res, next, null, posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				}
				messages.push(message);
			} else if (req.body.ban) {
				const { message, action, query } = await banPoster(req, res, next, req.params.board, posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				}
				messages.push(message);
			}
		}
		if (hasPerms && (req.body.delete_ip_board || req.body.delete_ip_global)) {
			const deletePostIps = posts.map(x => x.ip);
			let query = {
				'ip': {
					'$in': deletePostIps
				}
			};
			if (req.body.delete_ip_board) {
				query['board'] = req.params.board;
			}
			const deleteIpPosts = await Posts.db.find(query).toArray();
			if (deleteIpPosts && deleteIpPosts.length > 0) {
				const { message } = await deletePosts(req, res, next, deleteIpPosts, req.params.board);
				messages.push(message);
				aggregateNeeded = true;
			}
		} else if (req.body.delete) {
			const { message } = await deletePosts(req, res, next, passwordPosts, req.params.board);
			messages.push(message);
			aggregateNeeded = true;
		} else {
			// if it was getting deleted, we cant do any of these
			if (req.body.delete_file) {
				const { message, action, query } = await deletePostsFiles(passwordPosts);
				if (action) {
					aggregateNeeded = true;
					passwordCombinedQuery[action] = { ...passwordCombinedQuery[action], ...query}
				}
				messages.push(message);
			} else if (req.body.spoiler) {
				const { message, action, query } = spoilerPosts(passwordPosts);
				if (action) {
					passwordCombinedQuery[action] = { ...passwordCombinedQuery[action], ...query}
				}
				messages.push(message);
			}
			if (hasPerms) {
				//lock, sticky, sage
				if (req.body.sage) {
					const { message, action, query } = sagePosts(posts);
					if (action) {
						combinedQuery[action] = { ...combinedQuery[action], ...query}
					}
					messages.push(message);
				}
				if (req.body.lock) {
					const { message, action, query } = lockPosts(posts);
					if (action) {
						combinedQuery[action] = { ...combinedQuery[action], ...query}
					}
					messages.push(message);
				}
				if (req.body.sticky) {
					const { message, action, query } = stickyPosts(posts);
					if (action) {
						combinedQuery[action] = { ...combinedQuery[action], ...query}
					}
					messages.push(message);
				}
			}
			// cannot report and dismiss at same time
			if (req.body.report) {
				const { message, action, query } = reportPosts(req, posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				}
				messages.push(message);
			} else if (hasPerms && req.body.dismiss) {
				const { message, action, query } = dismissReports(posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				}
				messages.push(message);
			}
			// cannot report and dismiss at same time
			if (req.body.global_report) {
				const { message, action, query } = globalReportPosts(req, posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				}
				messages.push(message);
			} else if (hasPerms && req.body.global_dismiss) {
				const { message, action, query } = dismissGlobalReports(posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				}
				messages.push(message);
			}
		}
		const dbPromises = []
		if (Object.keys(combinedQuery).length > 0) {
			dbPromises.push(
				Posts.db.updateMany({
					'_id': {
						'$in': postMongoIds
					}
				}, combinedQuery)
			)
		}
		if (Object.keys(passwordCombinedQuery).length > 0) {
			dbPromises.push(
				Posts.db.updateMany({
					'_id': {
						'$in': passwordPostMongoIds
					}
				}, passwordCombinedQuery)
			)
		}
		await Promise.all(dbPromises);
		if (aggregateNeeded) {
			const threadsToUpdate = [...new Set(posts.filter(post => post.thread !== null))];
			//recalculate and set correct aggregation numbers again
			await Promise.all(threadsToUpdate.map(async (post) => {
				const replyCounts = await Posts.getReplyCounts(post.board, post.thread);
				let replyposts = 0;
				let replyfiles = 0;
				if (replyCounts[0]) {
					replyposts = replyCounts[0].replyposts;
					replyfiles = replyCounts[0].replyfiles;
				}
				Posts.setReplyCounts(post.board, post.thread, replyposts, replyfiles);
			}));
		}
	} catch (err) {
		return next(err);
	}

	return res.render('message', {
		'title': 'Success',
		'messages': messages,
		'redirect': `/${req.params.board}`
	});

});

//unban
router.post('/board/:board/unban', Boards.exists, banCheck, checkPermsMiddleware, paramConverter, async (req, res, next) => {

	//keep this for later in case i add other options to unbans
	const errors = [];

	if (!req.body.checkedbans || req.body.checkedbans.length === 0 || req.body.checkedbans.length > 10) {
		errors.push('Must select 1-10 bans')
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/${req.params.board}/manage`
		});
	}

	const messages = [];
	try {
		messages.push((await removeBans(req, res, next)));
	} catch (err) {
		return next(err);
	}

	return res.render('message', {
		'title': 'Success',
		'messages': messages,
		'redirect': `/${req.params.board}/manage`
	});

});

router.post('/global/actions', checkPermsMiddleware, paramConverter, async(req, res, next) => {

	const errors = [];

	//make sure they checked 1-10 posts
	if (!req.body.globalcheckedposts || req.body.globalcheckedposts.length === 0 || req.body.globalcheckedposts.length > 10) {
		errors.push('Must select 1-10 posts')
	}

	const { anyGlobal } = actionChecker(req);

	//make sure they selected at least 1 global action
	if (!anyGlobal) {
		errors.push('Invalid actions selected');
	}

	//check that actions are valid
	if (req.body.password && req.body.password.length > 50) {
		errors.push('Password must be 50 characters or less');
	}
	if (req.body.report_reason && req.body.report_reason.length > 50) {
		errors.push('Report must be 50 characters or less');
	}
	if (req.body.ban_reason && req.body.ban_reason.length > 50) {
		errors.push('Ban reason must be 50 characters or less');
	}
	if (req.body.report && (!req.body.report_reason || req.body.report_reason.length === 0)) {
		errors.push('Reports must have a reason')
	}

	//return the errors
	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': '/globalmanage'
		})
	}

	//get posts with global ids only
	const posts = await Posts.globalGetPosts(req.body.globalcheckedposts, true);
	if (!posts || posts.length === 0) {
		return res.status(404).render('message', {
			'title': 'Not found',
			'errors': 'Selected posts not found',
			'redirect': '/globalmanage'
		})
	}

	//get the ids
	const postMongoIds = posts.map(post => Mongo.ObjectId(post._id));
	const messages = [];
	const combinedQuery = {};
	let aggregateNeeded = false;
	try {
		if (req.body.global_ban) {
			const { message, action, query } = await banPoster(req, res, next, null, posts);
			if (action) {
				combinedQuery[action] = { ...combinedQuery[action], ...query}
			}
			messages.push(message);
		}
		if (hasPerms && req.body.delete_ip_global) {
			const deletePostIps = posts.map(x => x.ip);
			const deleteIpPosts = await Posts.db.find({
				'ip': {
					'$in': deletePostIps
				}
			}).toArray();
			if (deleteIpPosts && deleteIpPosts.length > 0) {
				const { message } = await deletePosts(req, res, next, deleteIpPosts, null);
				messages.push(message);
				aggregateNeeded = true;
			}
		} else if (req.body.delete) {
			const { message } = await deletePosts(req, res, next, posts);
			messages.push(message);
			aggregateNeeded = true;
		} else {
			// if it was getting deleted, we cant do any of these
			if (req.body.delete_file) {
				const { message, action, query } = await deletePostsFiles(posts);
				if (action) {
					aggregateNeeded = true;
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				}
				messages.push(message);
			}
			if (req.body.global_dismiss) {
				const { message, action, query } = dismissGlobalReports(posts);
				if (action) {
					combinedQuery[action] = { ...combinedQuery[action], ...query}
				}
				messages.push(message);
			}
		}
		if (Object.keys(combinedQuery).length > 0) {
			await Posts.db.updateMany({
				'_id': {
					'$in': postMongoIds
				}
			}, combinedQuery);
		}
		if (aggregateNeeded) {
			const threadsToUpdate = [...new Set(posts.filter(post => post.thread !== null))];
			//recalculate and set correct aggregation numbers again
			await Promise.all(threadsToUpdate.map(async (post) => {
				const replyCounts = await Posts.getReplyCounts(post.board, post.thread);
				let replyposts = 0;
				let replyfiles = 0;
				if (replyCounts[0]) {
					replyposts = replyCounts[0].replyposts;
					replyfiles = replyCounts[0].replyfiles;
				}
				Posts.setReplyCounts(post.board, post.thread, replyposts, replyfiles);
			}));
		}
	} catch (err) {
		return next(err);
	}

	return res.render('message', {
		'title': 'Success',
		'messages': messages,
		'redirect': '/globalmanage'
	});

});

router.post('/global/unban', checkPermsMiddleware, paramConverter, async(req, res, next) => {

	const errors = [];

	if (!req.body.checkedbans || req.body.checkedbans.length === 0 || req.body.checkedbans.length > 10) {
		errors.push('Must select 1-10 bans')
	}

	if (errors.length > 0) {
		return res.status(400).render('message', {
			'title': 'Bad request',
			'errors': errors,
			'redirect': `/globalmanage`
		});
	}

	const messages = [];
	try {
		messages.push((await removeBans(req, res, next)));
	} catch (err) {
		return next(err);
	}

	return res.render('message', {
		'title': 'Success',
		'messages': messages,
		'redirect': `/globalmanage`
	});

});

module.exports = router;

