'use strict';

const { Roles } = require(__dirname+'/../../db/')
	, redis = require(__dirname+'/../redis/redis.js')
	, Permission = require(__dirname+'/permission.js');

const load = async () => {

	//todo: take a message argument from callback
	//maybe make it a separate func just for reloading single role?

	let roles = await Roles.find();
	roles = roles.reduce((acc, r) => {
		acc[r.name] = new Permission(r.permissions.toString('base64'));
		return acc;
	}, {});

	module.exports.roles = roles;

	module.exports.rolePermissionMap = {
		[roles.ANON.base64]: 'Regular User',
		// [roles.BOARD_STAFF_DEFAULTS.base64]: 'Board Staff Defaults',
		[roles.BOARD_STAFF.base64]: 'Board Staff',
		// [roles.BOARD_OWNER_DEFAULTS.base64]: 'Board Owner Defaults',
		[roles.BOARD_OWNER.base64]: 'Board Owner',
		[roles.GLOBAL_STAFF.base64]: 'Global Staff',
		[roles.ADMIN.base64]: 'Admin',
		[roles.ROOT.base64]: 'Root',
	};

	//Note: kinda redundant, might remove/change how this works
	module.exports.roleNameMap = {
		ANON: 'Regular User',
		BOARD_STAFF_DEFAULTS: 'Board Staff Defaults',
		BOARD_STAFF: 'Board Staff',
		BOARD_OWNER_DEFAULTS: 'Board Owner Defaults',
		BOARD_OWNER: 'Board Owner',
		GLOBAL_STAFF: 'Global Staff',
		ADMIN: 'Admin',
		ROOT: 'Root',
	};

};

redis.addCallback('roles', load);

module.exports = {
	roles: {},
	roleNameMap: {},
	rolePermissionMap: {},
	load,
};
