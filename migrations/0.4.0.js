'use strict';

const hashIp = require(__dirname+'/../lib/misc/haship.js')
	, { createCIDR, parse } = require('ip6addr')
	, Permission = require(__dirname+'/../lib/permission/permission.js')
	, { Permissions } = require(__dirname+'/../lib/permission/permissions.js')
	, { Binary } = require('mongodb');

module.exports = async(db, redis) => {

// IP CLOAKING
	const postIps = await db.collection('posts').distinct('ip.raw');
	const logIps = await db.collection('modlog').distinct('ip.raw');
	const banIps = await db.collection('bans').distinct('ip.raw');
	const allDistinctIps = postIps.concat(logIps).concat(banIps);
	const ipBulkWrites = allDistinctIps.map(ip => {
		const ipSet = {};
		try {
			const ipParsed = parse(ip);
			const ipKind = ipParsed.kind();
			const ipStr = ipParsed.toString({
				format: ipKind === 'ipv4' ? 'v4' : 'v6',
				zeroElide: false,
				zeroPad: false,
			});
			let qrange
				, hrange;
			if (ipKind === 'ipv4') {
				qrange = createCIDR(ipStr, 24).toString();
				hrange = createCIDR(ipStr, 16).toString();
			} else {
				qrange = createCIDR(ipStr, 64).toString();
				hrange = createCIDR(ipStr, 48).toString();
			}
			ipSet['ip.cloak'] = `${hashIp(hrange).substring(0,8)}.${hashIp(qrange).substring(0,7)}.${hashIp(ipStr).substring(0,7)}.IP`;
		} catch (e) {
			//-1 old "iphashpermlevel" or bypass ids, just shorten them
			const shortenedOldHash = `${hashIp(ip).slice(-10)}.IP`;
			ipSet['ip.raw'] = shortenedOldHash;
			ipSet['ip.cloak'] = shortenedOldHash;
		}
		return {
			'updateMany': {
				'filter': {
					'ip.raw': ip
				},
				'update': {
					'$unset': {
						'ip.single': '',
						'ip.qrange': '',
						'ip.hrange': '',
					},
					'$set': ipSet,
				}
			}
		};
	});
	console.log('adjusting ip in modlogs, bans and posts');
	//the bulkwrites should work for ip, bans, and logs
	await db.collection('posts').bulkWrite(ipBulkWrites);
	await db.collection('modlog').bulkWrite(ipBulkWrites);
	await db.collection('bans').bulkWrite(ipBulkWrites);
	console.log('removing saved posts inside bans');
	await db.collection('bans').updateMany({}, {
		'$set':{
			'posts': null,
		}
	});
	console.log('clearing reports');
	await db.collection('posts').updateMany({}, {
		'$set':{
			'reports': [],
			'globalreports': [],
		}
	});
	//drop old ban indexes that indexed ip.single, then recreate
	console.log('recreating bans indexes');
	await db.collection('bans').dropIndexes();
	await db.collection('bans').createIndex({ 'ip.cloak': 1 , 'board': 1 });
	await db.collection('bans').createIndex({ 'expireAt': 1 }, { expireAfterSeconds: 0 });

// PERMISSIONS UPDATE
	console.log('making db changes for permissions update');
	console.log('setting new permission templates to replace old permission "levels"');
	const ANON = new Permission();
	ANON.setAll([
		Permissions.USE_MARKDOWN_PINKTEXT, Permissions.USE_MARKDOWN_GREENTEXT, Permissions.USE_MARKDOWN_BOLD, 
		Permissions.USE_MARKDOWN_UNDERLINE, Permissions.USE_MARKDOWN_STRIKETHROUGH, Permissions.USE_MARKDOWN_TITLE, 
		Permissions.USE_MARKDOWN_ITALIC, Permissions.USE_MARKDOWN_SPOILER, Permissions.USE_MARKDOWN_MONO, 
		Permissions.USE_MARKDOWN_CODE, Permissions.USE_MARKDOWN_DETECTED, Permissions.USE_MARKDOWN_LINK, 
		Permissions.USE_MARKDOWN_DICE, Permissions.USE_MARKDOWN_FORTUNE, Permissions.CREATE_BOARD, 
		Permissions.CREATE_ACCOUNT
	]);
	const BOARD_STAFF = new Permission(ANON.base64);
	BOARD_STAFF.setAll([
		Permissions.MANAGE_BOARD_GENERAL, Permissions.MANAGE_BOARD_BANS, Permissions.MANAGE_BOARD_LOGS, 
	]);
	const BOARD_OWNER = new Permission(BOARD_STAFF.base64);
	BOARD_OWNER.setAll([
		Permissions.MANAGE_BOARD_OWNER, Permissions.MANAGE_BOARD_STAFF, Permissions.MANAGE_BOARD_CUSTOMISATION, 
		Permissions.MANAGE_BOARD_SETTINGS,
	]);
	const GLOBAL_STAFF = new Permission(BOARD_OWNER.base64);
	GLOBAL_STAFF.setAll([
		Permissions.MANAGE_GLOBAL_GENERAL, Permissions.MANAGE_GLOBAL_BANS, Permissions.MANAGE_GLOBAL_LOGS, Permissions.MANAGE_GLOBAL_NEWS, 
		Permissions.MANAGE_GLOBAL_BOARDS, Permissions.MANAGE_GLOBAL_SETTINGS, Permissions.MANAGE_BOARD_OWNER, Permissions.BYPASS_FILTERS, 
		Permissions.BYPASS_BANS, Permissions.BYPASS_SPAMCHECK, Permissions.BYPASS_RATELIMITS,
	]);
	const ADMIN = new Permission(GLOBAL_STAFF.base64);
	ADMIN.setAll([
		Permissions.MANAGE_GLOBAL_ACCOUNTS, Permissions.MANAGE_GLOBAL_ROLES, Permissions.VIEW_RAW_IP, 
	]);
	const ROOT = new Permission();
	ROOT.setAll(Permission.allPermissions);
	await db.collection('roles').deleteMany({});
	await db.collection('roles').insertMany([
		{ name: 'ANON', permissions: Binary(ANON.array) },
		{ name: 'BOARD_STAFF', permissions: Binary(BOARD_STAFF.array) },
		{ name: 'BOARD_OWNER', permissions: Binary(BOARD_OWNER.array) },
		{ name: 'GLOBAL_STAFF', permissions: Binary(GLOBAL_STAFF.array) },
		{ name: 'ADMIN', permissions: Binary(ADMIN.array) },
		{ name: 'ROOT', permissions: Binary(ROOT.array) },
	]);
	await db.collection('accounts').updateMany({ authLevel: 0 }, {
		'$set': {
			'permissions': Binary(ROOT.array),
		},
	});
	await db.collection('accounts').updateMany({ authLevel: 1 }, {
		'$set': {
			'permissions': Binary(GLOBAL_STAFF.array),
		},
	});
	//not doing 2 and 3 anymore, since they were a weird, ugly part of the old "levels" system.
	//they can be added back manually by editing global perms if desired
	await db.collection('accounts').updateMany({ authLevel: { $gte: 2 } }, { //gte2, to get 2, 3, and 4.
		'$set': {
			'permissions': Binary(ANON.array),
		},
	});
	console.log('renaming account modBoards->staffBoards');
	await db.collection('accounts').updateMany({}, {
		'$unset': {
			'authLevel': '',
		},
		'$rename': {
			'modBoards': 'staffBoards',
		},
	});
	console.log('Adjusting global settings, and removing some redundant global settings that are now permission controlled');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$unset': {
			'userAccountCreation': '',
			'userBoardCreation': '',
			'ipHashPermLevel': '',
			'deleteBoardPermLevel': '',
		},
		'$set': {
			'dontStoreRawIps': false,
		}
	});
	//board moderators -> staff, and give them all the BOARD_STAFF perms
	console.log('converting old "moderators" arrays to "staff" perms map and giving BOARD_STAFF template');
	const allBoards = await db.collection('boards').find({ webring: false }).toArray();
	const staffBulkWrites = allBoards.map(board => {
		const staffObject = board.settings.moderators.reduce((acc, mod) => {
			acc[mod] = {
				permissions: Binary(BOARD_STAFF.array),
				addedDate: new Date(),
			};
			return acc;
		}, {});
		//add add the BO to staff
		staffObject[board.owner] = {
			permissions: Binary(BOARD_OWNER.array),
			addedDate: new Date(),
		};
		return {
			'updateOne': {
				'filter': {
					'_id': board._id,
				},
				'update': {
					'$unset': {
						'settings.moderators': '',
					},
					'$set': {
						'staff': staffObject,
					}
				}
			}
		};
	});
	await db.collection('boards').bulkWrite(staffBulkWrites);
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
	console.log('Clearing user and board cache');
	await redis.deletePattern('board:*');
	console.log('Deleting all sessions from redis (logs all users out)');
	await redis.deletePattern('sess:*');
	console.log('Deleting users cache');
	await redis.deletePattern('users:*');
};
