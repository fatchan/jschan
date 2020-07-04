'use strict';

const { Bans, Modlogs } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../helpers/dynamic.js')
	, hashIp = require(__dirname+'/../../helpers/dynamic.js')
	, buildQueue = require(__dirname+'/../../queue.js')
	, { isIP } = require('net')
	, { ipHashPermLevel, defaultBanDuration } = require(__dirname+'/../../configs/main.js');

module.exports = async (req, res, redirect) => {

	const actionDate = new Date();

	const banPromise = Bans.insertOne({
		//note: raw ip and type single because of 
        'type': 'single',
        'ip': {
            'single': isIP(req.body.ip) ? hashIp(req.body.ip) : req.body.ip,
            'raw':  req.body.ip,
        },
        'reason': req.body.ban_reason || req.body.log_message || 'No reason specified',
        'board': req.params.board || null,
        'posts': null,
        'issuer': req.session.user.username,
        'date': actionDate,
        'expireAt': new Date(actionDate.getTime() + (req.body.ban_duration || defaultBanDuration)),
        'allowAppeal': req.body.no_appeal ? false : true,
        'appeal': null,
        'seen': false,
    });

	const modlogPromise = Modlogs.insertOne({
		'board': req.params.board || null,
		'postIds': [],
		'actions': [(req.params.board ? 'Ban' : 'Global Ban')],
		'date': actionDate,
		'showUser': !req.body.hide_name || res.locals.permLevel >= 4 ? true : false,
		'message': req.body.log_message || null,
		'user': res.locals.permLevel < 4 ? req.session.user.username : 'Unregistered User',
		'ip': {
			'single': res.locals.ip.single,
			'raw': res.locals.ip.raw
		}
	});

	await Promise.all([banPromise, modlogPromise]);

	if (req.params.board) {
		buildQueue.push({
			'task': 'buildModLog',
			'options': {
				'board': res.locals.board,
			}
		});
		buildQueue.push({
			'task': 'buildModLogList',
			'options': {
				'board': res.locals.board,
			}
		});
	}

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': 'Added ban',
		redirect,
	});

}
