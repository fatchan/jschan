'use strict';

const { Bans } = require(__dirname+'/../../db/')
	, Socketio = require(__dirname+'/../../lib/misc/socketio.js')
	, config = require(__dirname+'/../../lib/misc/config.js');

module.exports = async (req, res) => {

	const { __, __n } = res.locals;
	const { defaultBanDuration } = config.get;
	const banDate = new Date();
	const banExpiry = new Date(banDate.getTime() + (req.body.ban_duration || defaultBanDuration)); //uses config default if missing or malformed
	const banReason = req.body.ban_reason || req.body.log_message || __('No reason specified');
	const allowAppeal = (req.body.no_appeal || req.body.ban_q || req.body.ban_h) ? false : true; //dont allow appeals for range bans

	const bans = [];

	if (req.body.ban || req.body.global_ban) {
		const banBoard = req.body.global_ban ? [null, req.params.board] : req.params.board;
		const ipPosts = res.locals.posts.reduce((acc, post) => {
			if (!acc[post.ip.cloak]) {
				acc[post.ip.cloak] = [];
			}
			acc[post.ip.cloak].push(post);
			if (req.body.ban_reason) {
				//send banmessage over websocket
				Socketio.emitRoom(`${post.board}-${post.thread || post.postId}`, 'markPost', {
					postId: post.postId,
					type: 'banmessage',
					banmessage: req.body.ban_reason,
				});
			}
			return acc;
		}, {});
		for (let ip in ipPosts) {
			//should we at some point filter these to not bother banning pruned ips?
			const thisIpPosts = ipPosts[ip];
			let banRange = 0;
			let banIp = {
				cloak: thisIpPosts[0].ip.cloak,
				raw: thisIpPosts[0].ip.raw,
				type: thisIpPosts[0].ip.type,
			};
			if (req.body.ban_h) {
				banRange = 2;
				banIp.cloak = thisIpPosts[0].ip.cloak
					.split('.')
					.slice(0,1)
					.join('.');
			} else if (req.body.ban_q) {
				banRange = 1;
				banIp.cloak = thisIpPosts[0].ip.cloak
					.split('.')
					.slice(0,2)
					.join('.');
			}
			bans.push({
				'global': req.body.global_ban != null,
				'range': banRange,
				'ip': banIp,
				'reason': banReason,
				'board': banBoard,
				'posts': req.body.preserve_post ? thisIpPosts : null,
				'issuer': req.session.user,
				'date': banDate,
				'expireAt': banExpiry,
				allowAppeal,
				'appeal': null,
				'showUser': !req.body.hide_name,
				'note': null,
				'seen': false,
			});
		}
	}

	if (req.body.report_ban || req.body.global_report_ban) {
		const banBoard = req.body.global_report_ban ? [null, req.params.board] : req.params.board;
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
					if (req.body.checkedreports.includes(r.id.toString())) {
						return r.ip;
					}
				});
				ips = ips.concat(matches);
			}
			ips = ips.filter(n => n);
			[...new Set(ips)].forEach(ip => {
				bans.push({
					'global': req.body.global_report_ban != null,
					'range': 0,
					'ip': ip,
					'reason': banReason,
					'board': banBoard,
					'posts': null,
					'issuer': req.session.user,
					'date': banDate,
					'expireAt': banExpiry,
					allowAppeal,
					'appeal': null,
					'showUser': !req.body.hide_name,
					'note': null,
					'seen': false
				});
			});
		});
	}

	const numBans = await Bans.insertMany(bans).then(result => result.insertedCount);

	const query = {
		message: __n('Added %s bans', numBans),
	};

	if ((req.body.ban || req.body.global_ban ) && req.body.ban_reason) {
		res.locals.actions.numBuild++;//there was a ban reason, so we may need to rebuild some pages, since banning is usually not a building action
		query['action'] = '$set';
		query['query'] = {
			'banmessage': req.body.ban_reason
		};
	}

	return query;

};
