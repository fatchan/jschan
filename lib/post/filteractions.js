'use strict';

const { Bans } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../misc/dynamic.js');

//ehhh, kinda too many args
module.exports = async (req, res, globalFilter, hitFilter, filterMode,
	filterMessage, filterBanDuration, filterBanAppealable, redirect) => {

	const { __ } = res.locals;

	const blockMessage = __('Your post was blocked by a word filter') + (filterMessage ? ': ' + filterMessage : '');

	if (filterMode === 1) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': __('Bad request'),
			'message': blockMessage,
			'redirect': redirect
		});
	} else {
		const banBoard = globalFilter ? null : res.locals.board._id;
		const banDate = new Date();
		const banExpiry = new Date(filterBanDuration + banDate.getTime());
		const ban = {
			'ip': {
				'cloak': res.locals.ip.cloak,
				'raw': res.locals.ip.raw,
				'type': res.locals.ip.type,
			},
			'range': 0,
			'reason': __(`${globalFilter ? 'global ' :''}word filter auto ban`) + (filterMessage ? ': ' + filterMessage : ''),
			'board': banBoard,
			'posts': null,
			'issuer': 'system', //todo: make a "system" property instead?
			'date': banDate,
			'expireAt': banExpiry,
			'allowAppeal': filterBanAppealable,
			'showUser': true,
			'note': __(`${globalFilter ? 'global ' :''}filter hit: "%s"`, (hitFilter)),
			'seen': true,
		};
		const insertedResult = await Bans.insertOne(ban);
		//add and delete some props for the dynamic response
		ban._id = insertedResult.insertedId;
		ban.ip.raw = null;
		ban.note = null;
		return dynamicResponse(req, res, 403, 'ban', {
			bans: [ban]
		});
	}

};
