'use strict';

const Bans = require(__dirname+'/../../db/bans.js')

module.exports = async (req, res, next) => {

	const banDate = new Date();
	const banExpiry = new Date(req.body.ban_duration ? banDate.getTime() + req.body.ban_duration : 8640000000000000); //perm if none or malformed input
	const banReason = req.body.ban_reason || 'No reason specified';
	const banBoard = req.body.global_ban ? null : req.params.board;

	const bans = res.locals.posts.map(post => {
		return {
			'ip': post.ip,
			'reason': banReason,
			'board': banBoard,
			'post': req.body.preserve_post ? post : null,
			'issuer': req.session.user.username,
			'date': banDate,
			'expireAt': banExpiry
		}
	});

	const numBans = await Bans.insertMany(bans).then(result => result.insertedCount);

	return {
        message: `Added ${numBans} bans`,
        action:'$set',
        query: {
            'banmessage': req.body.ban_reason || null
        }
    };

}
