'use strict';

//Note: if I drastically change permissions lib in future this might break. hmmmmm......
const { Permissions } = require(__dirname+'/../lib/permission/permissions.js')
	, Permission = require(__dirname+'/../lib/permission/permission.js')
	, Mongo = require(__dirname+'/../db/db.js');
	
module.exports = async(db, redis) => {

	console.log('Updating account permissions to shift some bits');
	const accounts = await db.collection('accounts').find().toArray();
	for (let acc of accounts) {
		const updatingPerms = new Permission(acc.permissions.toString('base64'));
		console.log('updating', acc._id);
		//take the old permissions
		const INITIAL_MANAGE_GLOBAL_GENERAL = updatingPerms.get(10);
		const INITIAL_MANAGE_GLOBAL_BANS = updatingPerms.get(11);
		//move them to new bits
		updatingPerms.set(Permissions.MANAGE_GLOBAL_GENERAL, INITIAL_MANAGE_GLOBAL_GENERAL);
		updatingPerms.set(Permissions.MANAGE_GLOBAL_BANS, INITIAL_MANAGE_GLOBAL_BANS);
		//add new anonymizer bypass permission, default false
		updatingPerms.set(Permissions.BYPASS_ANONYMIZER_RESTRICTIONS, false);
		//write the change to DB
		await db.collection('accounts').updateOne({
			'_id': acc._id,
		}, {
			'$set': {
				'permissions': Mongo.Binary(updatingPerms.array),
			}
		});
	}

	console.log('Updating role permissions to shift some bits');
	const roles = await db.collection('roles').find().toArray();
	for (let r of roles) {
		const updatingPerms = new Permission(r.permissions.toString('base64'));
		console.log('updating', r.name);
		//take the old permissions
		const INITIAL_MANAGE_GLOBAL_GENERAL = updatingPerms.get(10);
		const INITIAL_MANAGE_GLOBAL_BANS = updatingPerms.get(11);
		//move them to new bits
		updatingPerms.set(Permissions.MANAGE_GLOBAL_GENERAL, INITIAL_MANAGE_GLOBAL_GENERAL);
		updatingPerms.set(Permissions.MANAGE_GLOBAL_BANS, INITIAL_MANAGE_GLOBAL_BANS);
		//add new anonymizer bypass permission, default false
		updatingPerms.set(Permissions.BYPASS_ANONYMIZER_RESTRICTIONS, false);
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
