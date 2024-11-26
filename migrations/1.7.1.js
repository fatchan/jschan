'use strict';

//Note: if I drastically change permissions lib in future this might break. hmmmmm......
const { Permissions } = require(__dirname+'/../lib/permission/permissions.js')
	, Permission = require(__dirname+'/../lib/permission/permission.js')
	, Mongo = require(__dirname+'/../db/db.js');
	
module.exports = async(db, redis) => {

	console.log('Updating exsting board owners to have the updated markdown image bit in their board level perms');
	const boards = await db.collection('boards').find({
		webring: false,
	}).toArray();
	for (let b of boards) {
		const boardOwner = b.owner;
		if (!boardOwner) {
			continue;
		}
		const boardOwnerPerm = new Permission(b.staff[boardOwner].permissions.toString('base64'));
		boardOwnerPerm.set(Permissions.USE_MARKDOWN_IMAGE, true);
		//write the change to DB
		await db.collection('boards').updateOne({
			'_id': b._id,
		}, {
			'$set': {
				[`staff.${boardOwner}.permissions`]: Mongo.Binary(boardOwnerPerm.array),
			}
		});
	}

	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
	console.log('Clearing sessions and users cache');
	await redis.deletePattern('users:*');
	await redis.deletePattern('sess:*');

};
