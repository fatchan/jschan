'use strict';

const { Permissions } = require(__dirname+'/../permission/permissions.js')
	, actions = [
		{name:'unlink_file', global:true, passwords:true, build:true},
		{name:'delete_file', global:true, auth:Permissions.MANAGE_GLOBAL_GENERAL, passwords:false, build:true},
		{name:'spoiler', global:true, passwords:true, build:true},
		{name:'edit', global:true, auth:Permissions.MANAGE_BOARD_GENERAL, passwords:false, build:true},
		{name:'delete', global:true, passwords:true, build:true},
		{name:'lock', global:false, auth:Permissions.MANAGE_BOARD_GENERAL, passwords:false, build:true},
		{name:'sticky', global:false, auth:Permissions.MANAGE_BOARD_GENERAL, passwords:false, build:true},
		{name:'cyclic', global:false, auth:Permissions.MANAGE_BOARD_GENERAL, passwords:false, build:true},
		{name:'bumplock', global:false, auth:Permissions.MANAGE_BOARD_GENERAL, passwords:false, build:true},
		{name:'report', global:false, passwords:false, build:false},
		{name:'global_report', global:true, passwords:false, build:false},
		{name:'move', global:false, auth:Permissions.MANAGE_BOARD_GENERAL, passwords:false, build:true},
		{name:'delete_ip_board', global:true, auth:Permissions.MANAGE_BOARD_GENERAL, passwords:false, build:true},
		{name:'delete_ip_thread', global:true, auth:Permissions.MANAGE_BOARD_GENERAL, passwords:false, build:true},
		{name:'delete_ip_global', global:true, auth:Permissions.MANAGE_GLOBAL_GENERAL, passwords:false, build:true},
		{name:'dismiss', global:false, auth:Permissions.MANAGE_BOARD_GENERAL, passwords:false, build:false},
		{name:'global_dismiss', global:true, auth:Permissions.MANAGE_GLOBAL_GENERAL, passwords:false, build:false},
		{name:'report_ban', global:false, auth:Permissions.MANAGE_BOARD_GENERAL, passwords:false, build:false},
		{name:'global_report_ban', global:true, auth:Permissions.MANAGE_GLOBAL_GENERAL, passwords:false, build:false},
		{name:'ban', global:false, auth:Permissions.MANAGE_BOARD_GENERAL, passwords:false, build:false},
		{name:'global_ban', global:true, auth:Permissions.MANAGE_GLOBAL_GENERAL, passwords:false, build:false},
	];

module.exports = (req, res) => {

	let numGlobal = 0
		, numPasswords = 0
		, numBuild = 0
		, hasPermission = true
		, validActions = [];

	for (let i = 0; i < actions.length; i++) {
		const action = actions[i];
		const bodyAction = req.body[action.name];
		if (bodyAction != null) {
			validActions.push(action.name);
			if (action.global) {
				numGlobal++;
			}
			if (action.auth && !res.locals.permissions.get(action.auth)) {
				hasPermission = false;
				//maybe break;?
			}
			if (action.passwords) {
				numPasswords++;
			}
			if (action.build) {
				numBuild++;
			}
		}
	}

	return { numGlobal, hasPermission, validActions, numPasswords, numBuild };

};
