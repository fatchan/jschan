'use strict';

const { Bans } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../misc/dynamic.js')
	, FIELDS_TO_REPLACE = ['email', 'subject', 'message'];

module.exports = async (req, res, globalFilter, hit, filter, redirect) => {

	const { __ } = res.locals;

	const blockMessage = __('Your post was blocked by a word filter') + (filter.filterMessage ? ': ' + filter.filterMessage : '');

	if (filter.filterMode === 1) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': __('Bad request'),
			'message': blockMessage,
			'redirect': redirect
		});
	} else if (filter.filterMode === 2) {
		const banBoard = globalFilter ? [null, res.locals.board._id] : res.locals.board._id;
		const banDate = new Date();
		const banExpiry = new Date(filter.filterBanDuration + banDate.getTime());
		const ban = {
			'global': globalFilter ? true : false,
			'ip': {
				'cloak': res.locals.ip.cloak,
				'raw': res.locals.ip.raw,
				'type': res.locals.ip.type,
			},
			'range': 0,
			'reason': __(`${globalFilter ? 'global ' :''}word filter auto ban`) + (filter.filterMessage ? ': ' + filter.filterMessage : ''),
			'board': banBoard,
			'posts': null,
			'issuer': 'system', //todo: make a "system" property instead?
			'date': banDate,
			'expireAt': banExpiry,
			'allowAppeal': filter.filterBanAppealable,
			'showUser': true,
			'note': __(`${globalFilter ? 'global ' :''}filter hit: "%s"`, (hit)),
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
	} else {
		//the filter could have hit any part of the combinedstring
		for (const field of FIELDS_TO_REPLACE) {
			if (req.body[field]) {
				req.body[field] = req.body[field].replaceAll(hit, filter.replaceText);
			}
		}
		return;
	}

};
