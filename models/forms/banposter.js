'use strict';

const { Bans } = require(__dirname+'/../../db/')

module.exports = async (req, res, next) => {

	const banDate = new Date();
	const banExpiry = new Date(req.body.ban_duration ? banDate.getTime() + req.body.ban_duration : 8640000000000000); //perm if none or malformed input
	const banReason = req.body.ban_reason || 'No reason specified';
	const banBoard = req.body.global_ban ? null : req.params.board;
	const allowAppeal = req.body.no_appeal ? false : true;

	const bans = res.locals.posts.map(post => {
		return {
			'ip': post.ip,
			'reason': banReason,
			'board': banBoard,
			'post': req.body.preserve_post ? post : null,
			'issuer': req.session.user.username,
			'date': banDate,
			'expireAt': banExpiry,
			allowAppeal,
			'appeal': null
		}
	});

	const numBans = await Bans.insertMany(bans).then(result => result.insertedCount);

	const query = {
        message: `Added ${numBans} bans`,
	};
	if (req.body.ban_reason) {
		query['action'] = '$set';
		query['query'] = {
			'banmessage': req.body.ban_reason
		};
	}

	return query;

}
