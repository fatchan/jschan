'use strict';

const actions = [
	{name:'lock', global:false, auth:true, passwords:false},
	{name:'sticky', global:false, auth:true, passwords:false},
	{name:'sage', global:false, auth:true, passwords:false},
	{name:'report', global:false, auth:false, passwords:false},
	{name:'global_report', global:false, auth:false, passwords:false},
	{name:'spoiler', global:true, auth:false, passwords:true},
	{name:'delete', global:true, auth:false, passwords:true},
	{name:'delete_ip_board', global:false, auth:true, passwords:false},
	{name:'delete_ip_global', global:true, auth:true, passwords:false},
	{name:'delete_file', global:true, auth:false, passwords:true},
	{name:'dismiss', global:false, auth:true, passwords:false},
	{name:'global_dismiss', global:true, auth:true, passwords:false},
	{name:'ban', global:false, auth:true, passwords:false},
	{name:'global_ban', global:true, auth:true, passwords:false},
];

module.exports = (req, res) => {

	let anyGlobal = false
		, anyAuthed = false
		, anyPasswords = false
		, anyValid = false;

	for (let i = 0; i < actions.length; i++) {
		const action = actions[i];
		const bodyHasAction = req.body[action.name];
		if (bodyHasAction) {
			if (!anyGlobal && action.global) {
				anyGlobal = true;
			}
			if (!anyAuthed && action.auth) {
				anyAuthed = true;
			}
			if (!anyPasswords && action.passwords) {
				anyPasswords = true;
			}
			if (!anyValid) {
				anyValid = true;
			}
		}
		if (anyGlobal && anyAuthed && anyValid) {
			break;
		}
	}

	return { anyGlobal, anyAuthed, anyValid, anyPasswords };

}
