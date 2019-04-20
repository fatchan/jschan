'use strict';

const uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js')
	, hasPerms = require(__dirname+'/../../helpers/hasperms.js')
	, Bans = require(__dirname+'/../../db/bans.js')
	, Posts = require(__dirname+'/../../db/posts.js');

module.exports = async (req, res, next, board, posts) => {

	const bans = posts.map(post => {
		return {
			'ip': post.ip,
			'reason': req.body.ban_reason || 'No reason specified',
			'board': board,
			'post': req.body.preserve_post ? post : null,
			'issuer': req.session.user.username,
			'date': new Date(),
			'expireAt': new Date((new Date).getTime() + (72*1000*60*60)) // 72h ban
		}
	});

	const bannedIps = await Bans.insertMany(bans).then(result => result.insertedCount);

	return `Banned ${bannedIps} ips`;

}
