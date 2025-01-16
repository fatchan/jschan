'use strict';

//Note: if I drastically change permissions lib in future this might break. hmmmmm......
const { Permissions } = require(__dirname+'/../lib/permission/permissions.js')
	, Permission = require(__dirname+'/../lib/permission/permission.js')
	, Mongo = require(__dirname+'/../db/db.js');
	
module.exports = async(db, redis) => {

	console.log('Updating account permissions to add image markdown to globals');
	const accounts = await db.collection('accounts').find().toArray();
	for (let acc of accounts) {
		const updatingPerms = new Permission(acc.permissions.toString('base64'));
		//if theyre a global staff, add the new image markdown perm
		const INITIAL_MANAGE_GLOBAL_GENERAL = updatingPerms.get(11);
		//move them to new bits
		if (INITIAL_MANAGE_GLOBAL_GENERAL === true) {
			console.log('updating account', acc._id);
			updatingPerms.set(Permissions.USE_MARKDOWN_IMAGE, true);
		}
		//write the change to DB
		await db.collection('accounts').updateOne({
			'_id': acc._id,
		}, {
			'$set': {
				'permissions': Mongo.Binary(updatingPerms.array),
			}
		});
	}

	console.log('Updating role permissions to add image markdown to global staff');
	const roles = await db.collection('roles').find().toArray();
	for (let r of roles) {
		const updatingPerms = new Permission(r.permissions.toString('base64'));
		const INITIAL_MANAGE_GLOBAL_GENERAL = updatingPerms.get(11);
		if (INITIAL_MANAGE_GLOBAL_GENERAL === true) {
			console.log('updating role', r._id);
			updatingPerms.set(Permissions.USE_MARKDOWN_IMAGE, true);
		}
		//write the change to DB
		await db.collection('role').updateOne({
			'_id': r._id,
		}, {
			'$set': {
				'permissions': Mongo.Binary(updatingPerms.array),
			}
		});
	}

	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
	console.log('Clearing sessions and users cache');
	await redis.deletePattern('users:*');
	await redis.deletePattern('sess:*');
	
};
