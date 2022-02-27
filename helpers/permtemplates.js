'use strict';

const Permissions = require(__dirname+'/permissions.js')
	, Permission = require(__dirname+'/permission.js');

const ANON = new Permission()
ANON.setAll([
	Permissions.USE_MARKDOWN_PINKTEXT, Permissions.USE_MARKDOWN_GREENTEXT, Permissions.USE_MARKDOWN_BOLD, 
	Permissions.USE_MARKDOWN_UNDERLINE, Permissions.USE_MARKDOWN_STRIKETHROUGH, Permissions.USE_MARKDOWN_TITLE, 
	Permissions.USE_MARKDOWN_ITALIC, Permissions.USE_MARKDOWN_SPOILER, Permissions.USE_MARKDOWN_MONO, 
	Permissions.USE_MARKDOWN_CODE, Permissions.USE_MARKDOWN_DETECTED, Permissions.USE_MARKDOWN_LINK, 
	Permissions.USE_MARKDOWN_DICE, Permissions.USE_MARKDOWN_FORTUNE, Permissions.CREATE_BOARD, 
	Permissions.CREATE_ACCOUNT
]);

const BOARD_STAFF = new Permission(ANON.base64)
BOARD_STAFF.setAll([
	Permissions.MANAGE_BOARD_GENERAL, Permissions.MANAGE_BOARD_BANS, Permissions.MANAGE_BOARD_LOGS, Permissions.MANAGE_BOARD_SETTINGS, Permissions.MANAGE_BOARD_CUSTOMISATION,
]);

const BOARD_OWNER = new Permission(BOARD_STAFF.base64)
BOARD_OWNER.setAll([
	Permissions.MANAGE_BOARD_OWNER, Permissions.MANAGE_BOARD_STAFF,
]);

const GLOBAL_STAFF = new Permission(BOARD_OWNER.base64);
GLOBAL_STAFF.setAll([
	//no MANAGE_GLOBAL_ACCOUNTS, for now
	Permissions.MANAGE_GLOBAL_GENERAL, Permissions.MANAGE_GLOBAL_BANS, Permissions.MANAGE_GLOBAL_LOGS, Permissions.MANAGE_GLOBAL_NEWS, 
	Permissions.MANAGE_GLOBAL_BOARDS, Permissions.MANAGE_GLOBAL_SETTINGS, Permissions.MANAGE_BOARD_OWNER, Permissions.BYPASS_FILTERS, 
	Permissions.BYPASS_BANS, Permissions.BYPASS_SPAMCHECK, Permissions.BYPASS_RATELIMITS,
]);

const ROOT = new Permission();
ROOT.setAll(Permission.allPermissions);

module.exports = {
	ANON,
	BOARD_STAFF,
	BOARD_OWNER,
	GLOBAL_STAFF,
	ROOT,
};
