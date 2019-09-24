'use strict';

const actions = [
	{name:'unlink_file', global:true, auth:4, passwords:true, build:true},
	{name:'delete_file', global:true, auth:1, passwords:false, build:true},
	{name:'spoiler', global:true, auth:4, passwords:true, build:true},
	{name:'delete', global:true, auth:4, passwords:true, build:true},
	{name:'lock', global:false, auth:3, passwords:false, build:true},
	{name:'sticky', global:false, auth:3, passwords:false, build:true},
	{name:'cyclic', global:false, auth:3, passwords:false, build:true},
	{name:'bumplock', global:false, auth:3, passwords:false, build:true},
	{name:'report', global:false, auth:4, passwords:false, build:false},
	{name:'global_report', global:true, auth:4, passwords:false, build:false},
	{name:'delete_ip_board', global:true, auth:3, passwords:false, build:true},
	{name:'delete_ip_global', global:true, auth:1, passwords:false, build:true},
	{name:'dismiss', global:false, auth:3, passwords:false, build:false},
	{name:'global_dismiss', global:true, auth:1, passwords:false, build:false},
	{name:'report_ban', global:false, auth:3, passwords:false, build:false},
	{name:'global_report_ban', global:true, auth:1, passwords:false, build:false},
	{name:'ban', global:false, auth:3, passwords:false, build:false},//will build if there is a ban message
	{name:'global_ban', global:true, auth:1, passwords:false, build:false},//will build if there is a ban message
];

module.exports = (req, res) => {

	let numGlobal = 0
		, authRequired = 4
		, numPasswords = 0
		, numBuild = 0
		, validActions = [];

	for (let i = 0; i < actions.length; i++) {
		const action = actions[i];
		const bodyHasAction = req.body[action.name];
		if (bodyHasAction) {
			validActions.push(action.name);
			if (action.global) {
				numGlobal++;
			}
			if (action.auth && action.auth < authRequired) {
				authRequired = action.auth;
			}
			if (action.passwords) {
				numPasswords++;
			}
			if (action.build) {
				numBuild++
			}
		}
	}

	return { numGlobal, authRequired, validActions, numPasswords, numBuild };

}
