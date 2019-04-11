'use strict';

const uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
	, hasPerms = require(__dirname+'/../../helpers/has-perms.js')
	, Bans = require(__dirname+'/../../db-models/bans.js')
	, Posts = require(__dirname+'/../../db-models/posts.js');

module.exports = async (req, res, board) => {

	//if user is not logged in or if logged in but not authed, they cannot ban
	if (!hasPerms(req, res)) {
		throw {
			'status': 403,
			'message': {
				'title': 'Forbidden',
				'message': 'You do not have permission to issue bans',
				'redirect': `/${req.params.board}`
			}
		};
	}

	//get all posts that were checked
	let posts = await Posts.getPosts(req.params.board, req.body.checked, true); //admin arument true, fetches passwords and salts

	if (!posts || posts.length === 0) {
		throw {
			'status': 400,
			'message': {
				'title': 'Bad requests',
				'message': 'No posts found',
				'redirect': `/${req.params.board}`
			}
		};
	}

	const bans = posts.map(post => {
		return {
			'ip': post.ip,
			'board': board,
			'post': post,
			'issuer': req.session.user.username
		}
	});

	let bannedIps = 0;
	const result = await Bans.insertMany(bans, board);
	console.log(result)
	bannedIps = result.insertedCount;

	return `Banned ${bannedIps} ips`;

}
