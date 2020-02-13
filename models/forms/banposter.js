'use strict';

const { Bans } = require(__dirname+'/../../db/')
	, { defaultBanDuration } = require(__dirname+'/../../configs/main.js');

module.exports = async (req, res, next) => {

	const banDate = new Date();
	const banExpiry = new Date(banDate.getTime() + (req.body.ban_duration || defaultBanDuration)); //uses config default if missing or malformed
	const banReason = req.body.ban_reason || req.body.log_message || 'No reason specified';
	const allowAppeal = (req.body.no_appeal || req.body.ban_q || req.body.ban_h) ? false : true; //dont allow appeals for range bans

	const bans = [];

	if (req.body.ban || req.body.global_ban) {
		const banBoard = req.body.global_ban ? null : req.params.board;
		const ipPosts = res.locals.posts.reduce((acc, post) => {
			if (!acc[post.ip.single]) {
				acc[post.ip.single] = [];
			}
			acc[post.ip.single].push(post);
			return acc;
		}, {});
		for (let ip in ipPosts) {
			const thisIpPosts = ipPosts[ip];
			let banIp = ip;
			if (req.body.ban_h) {
				banIp = thisIpPosts[0].ip.hrange;
			} else if (req.body.ban_q) {
				banIp = thisIpPosts[0].ip.qrange;
			}
			bans.push({
				'ip': banIp,
				'reason': banReason,
				'board': banBoard,
				'posts': req.body.preserve_post ? thisIpPosts : null,
				'issuer': req.session.user.username,
				'date': banDate,
				'expireAt': banExpiry,
				allowAppeal,
				'appeal': null,
				'seen': false,
			});
		}
	}

	if (req.body.report_ban || req.body.global_report_ban){
		const banBoard = req.body.global_report_ban ? null : req.params.board;
		res.locals.posts.forEach(post => {
			let ips = [];
			if (req.body.report_ban) {
				const matches = post.reports.map(r => {
					if (req.body.checkedreports.includes(r.id.toString())) {
						return r.ip;
					}
				});
				ips = ips.concat(matches);
			}
			if (req.body.global_report_ban) {
				const matches = post.globalreports.map(r => {
					if (req.body.checkedreports.includes(r.id)) {
						return r.ip;
					}
				});
				ips = ips.concat(matches);
			}
			[...new Set(ips)].forEach(ip => {
				bans.push({
					'ip': ip,
					'reason': banReason,
					'board': banBoard,
					'posts': null,
					'issuer': req.session.user.username,
					'date': banDate,
					'expireAt': banExpiry,
					allowAppeal,
					'appeal': null,
					'seen': false
				});
			});
		});
	}

	const numBans = await Bans.insertMany(bans).then(result => result.insertedCount);

	const query = {
        message: `Added ${numBans} bans`,
	};

	if ((req.body.ban || req.body.global_ban ) && req.body.ban_reason) {
		res.locals.actions.numBuild++;//there was a ban reason, so we may need to rebuild some pages, since banning is usually not a building action
		query['action'] = '$set';
		query['query'] = {
			'banmessage': req.body.ban_reason
		};
	}

	return query;

}
