'use strict';

const { permTemplates } = require(__dirname+'/../helpers/permtemplates.js')
	, Permission = require(__dirname+'/../helpers/permission.js')
	, { Binary } = require('mongodb');

module.exports = async(db, redis) => {
	console.log('making db changes for permissions update');
	console.log('setting new permission templates to replace old permission "levels"');
	await db.collection('accounts').updateMany({ authLevel: 0 }, {
		'$set': {
			'permissions': Binary(permTemplates.ROOT.array),
		},
	});
	await db.collection('accounts').updateMany({ authLevel: 1 }, {
		'$set': {
			'permissions': Binary(permTemplates.GLOBAL_STAFF.array),
		},
	});
	//not doing 2 and 3 anymore, since they were a weird, ugly part of the old "levels" system.
	//they can be added back manually by editing global perms if desired
	await db.collection('accounts').updateMany({ authLevel: { $gte: 2 } }, { //gte2, to get 2, 3, and 4.
		'$set': {
			'permissions': Binary(permTemplates.ANON.array),
		},
	});
	console.log('renaming account modBoards->staffBoards');
	await db.collection('accounts').updateMany({}, {
		'$unset': {
			'authLevel': "",
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
	const bulkWrites = allBoards.map(board => {
		const staffObject = board.settings.moderators.reduce((acc, mod) => {
			acc[mod] = {
				permissions: Binary(permTemplates.BOARD_STAFF.array),
				addedDate: new Date(),
			};
			return acc;
		}, {});
		//add add the BO to staff
		staffObject[board.owner] = {
			permissions: Binary(permTemplates.BOARD_OWNER.array),
			addedDate: new Date(),
		}
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
	await db.collection('boards').bulkWrite(bulkWrites);
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
	console.log('Clearing user and board cache');
	await redis.deletePattern('board:*');
	await redis.deletePattern('users:*');
};
