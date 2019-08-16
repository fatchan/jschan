'use strict';

const actions = [
	{name:'unlink_file', global:true, auth:4, passwords:true, build:true},
	{name:'delete_file', global:true, auth:1, passwords:false, build:true},
	{name:'spoiler', global:true, auth:4, passwords:true, build:true},
	{name:'delete', global:true, auth:4, passwords:true, build:true},
	{name:'lock', global:false, auth:3, passwords:false, build:true},
	{name:'sticky', global:false, auth:3, passwords:false, build:true},
	{name:'cyclic', global:false, auth:3, passwords:false, build:true},
	{name:'sage', global:false, auth:3, passwords:false, build:true},
	{name:'report', global:false, auth:4, passwords:false, build:false},
	{name:'global_report', global:true, auth:4, passwords:false, build:false},
	{name:'delete_ip_board', global:true, auth:3, passwords:false, build:true},
	{name:'delete_ip_global', global:true, auth:1, passwords:false, build:true},
	{name:'dismiss', global:false, auth:3, passwords:false, build:true},
	{name:'global_dismiss', global:true, auth:1, passwords:false, build:true},
	{name:'ban', global:false, auth:3, passwords:false, build:true},
	{name:'global_ban', global:true, auth:1, passwords:false, build:true},
];

module.exports = (req, res) => {

	let anyGlobal = 0
		, authRequired = 4
		, anyPasswords = 0
		, anyBuild = 0
		, validActions = [];

	for (let i = 0; i < actions.length; i++) {
		const action = actions[i];
		const bodyHasAction = req.body[action.name];
		if (bodyHasAction) {
			validActions.push(action.name);
			if (action.global) {
				anyGlobal++;
			}
			if (action.auth && action.auth < authRequired) {
				authRequired = action.auth;
			}
			if (action.passwords) {
				anyPasswords++;
			}
			if (action.build) {
				anyBuild++
			}
		}
	}

	return { anyGlobal, authRequired, validActions, anyPasswords, anyBuild };

}
