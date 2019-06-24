'use strict';

const actions = [
	{name:'unlink_file', global:true, auth:false, passwords:true, build:true},
	{name:'delete_file', global:true, auth:true, passwords:false, build:true},
	{name:'spoiler', global:true, auth:false, passwords:true, build:true},
	{name:'delete', global:true, auth:false, passwords:true, build:true},
	{name:'lock', global:false, auth:true, passwords:false, build:true},
	{name:'sticky', global:false, auth:true, passwords:false, build:true},
	{name:'sage', global:false, auth:true, passwords:false, build:true},
	{name:'report', global:false, auth:false, passwords:false, build:false},
	{name:'global_report', global:false, auth:false, passwords:false, build:false},
	{name:'delete_ip_board', global:false, auth:true, passwords:false, build:true},
	{name:'delete_ip_global', global:true, auth:true, passwords:false, build:true},
	{name:'dismiss', global:false, auth:true, passwords:false, build:false},
	{name:'global_dismiss', global:true, auth:true, passwords:false, build:false},
	{name:'ban', global:false, auth:true, passwords:false, build:true},
	{name:'global_ban', global:true, auth:true, passwords:false, build:true},
];

module.exports = (req, res) => {

	let anyGlobal = 0
		, anyAuthed = 0
		, anyPasswords = 0
		, anyBuild = 0
		, anyValid = 0;

	for (let i = 0; i < actions.length; i++) {
		const action = actions[i];
		const bodyHasAction = req.body[action.name];
		if (bodyHasAction) {
			anyValid++;
			if (action.global) {
				anyGlobal++;
			}
			if (action.auth) {
				anyAuthed++;
			}
			if (action.passwords) {
				anyPasswords++;
			}
			if (action.build) {
				anyBuild++
			}
		}
	}

	return { anyGlobal, anyAuthed, anyValid, anyPasswords, anyBuild };

}
