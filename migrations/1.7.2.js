'use strict';

//Note: if I drastically change permissions lib in future this might break. hmmmmm......
const { Permissions } = require(__dirname+'/../lib/permission/permissions.js')
	, Permission = require(__dirname+'/../lib/permission/permission.js')
	, { Binary } = require('mongodb');

module.exports = async(db, redis) => {

	const ANON = new Permission();
	ANON.setAll([
		Permissions.USE_MARKDOWN_PINKTEXT, Permissions.USE_MARKDOWN_GREENTEXT, Permissions.USE_MARKDOWN_BOLD, 
		Permissions.USE_MARKDOWN_UNDERLINE, Permissions.USE_MARKDOWN_STRIKETHROUGH, Permissions.USE_MARKDOWN_TITLE, 
		Permissions.USE_MARKDOWN_ITALIC, Permissions.USE_MARKDOWN_SPOILER, Permissions.USE_MARKDOWN_MONO, 
		Permissions.USE_MARKDOWN_CODE, Permissions.USE_MARKDOWN_DETECTED, Permissions.USE_MARKDOWN_LINK, 
		Permissions.USE_MARKDOWN_DICE, Permissions.USE_MARKDOWN_FORTUNE, Permissions.CREATE_BOARD, 
		Permissions.CREATE_ACCOUNT
	]);
	const BOARD_STAFF_DEFAULTS = new Permission(ANON.base64);
	BOARD_STAFF_DEFAULTS.setAll([
		Permissions.MANAGE_BOARD_GENERAL, Permissions.MANAGE_BOARD_BANS, Permissions.MANAGE_BOARD_LOGS,
	]);
	const BOARD_OWNER_DEFAULTS = new Permission(BOARD_STAFF_DEFAULTS.base64);
	BOARD_OWNER_DEFAULTS.setAll([
		Permissions.MANAGE_BOARD_OWNER, Permissions.MANAGE_BOARD_STAFF, Permissions.MANAGE_BOARD_CUSTOMISATION,
		Permissions.MANAGE_BOARD_SETTINGS, Permissions.USE_MARKDOWN_IMAGE
	]);

	console.log('Removing unnecessary unique index on roles db');
	await db.collection('roles').dropIndexes();

	console.log('Adding missing defaults "roles" to db');
	await db.collection('roles').insertMany([
		{ name: 'BOARD_STAFF_DEFAULTS', permissions: Binary(BOARD_STAFF_DEFAULTS.array) },
		{ name: 'BOARD_OWNER_DEFAULTS', permissions: Binary(BOARD_OWNER_DEFAULTS.array) },
	]);

	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
	console.log('Clearing sessions and users cache');
	await redis.deletePattern('users:*');
	await redis.deletePattern('sess:*');

};
