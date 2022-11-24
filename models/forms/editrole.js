'use strict';

const { Roles, Accounts } = require(__dirname+'/../../db/')
	, redis = require(__dirname+'/../../lib/redis/redis.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, roleManager = require(__dirname+'/../../lib/permission/rolemanager.js')
	, Permissions = require(__dirname+'/../../lib/permission/permissions.js')
	, Permission = require(__dirname+'/../../lib/permission/permission.js');

module.exports = async (req, res) => {

	let rolePermissions = new Permission(res.locals.editingRole.permissions);
	rolePermissions.set(Permissions.VIEW_RAW_IP, (req.body.VIEW_RAW_IP != null));
	rolePermissions.set(Permissions.CREATE_BOARD, (req.body.CREATE_BOARD != null));
	rolePermissions.set(Permissions.CREATE_ACCOUNT, (req.body.CREATE_ACCOUNT != null));
	rolePermissions.set(Permissions.BYPASS_BANS, (req.body.BYPASS_BANS != null));
	rolePermissions.set(Permissions.BYPASS_SPAMCHECK, (req.body.BYPASS_SPAMCHECK != null));
	rolePermissions.set(Permissions.BYPASS_RATELIMITS, (req.body.BYPASS_RATELIMITS != null));
	rolePermissions.set(Permissions.BYPASS_FILTERS, (req.body.BYPASS_FILTERS != null));
	rolePermissions.set(Permissions.BYPASS_CAPTCHA, (req.body.BYPASS_CAPTCHA != null));	
	rolePermissions.set(Permissions.MANAGE_GLOBAL_GENERAL, (req.body.MANAGE_GLOBAL_GENERAL != null));
	rolePermissions.set(Permissions.MANAGE_GLOBAL_BANS, (req.body.MANAGE_GLOBAL_BANS != null));
	rolePermissions.set(Permissions.MANAGE_GLOBAL_LOGS, (req.body.MANAGE_GLOBAL_LOGS != null));
	rolePermissions.set(Permissions.MANAGE_GLOBAL_NEWS, (req.body.MANAGE_GLOBAL_NEWS != null));
	rolePermissions.set(Permissions.MANAGE_GLOBAL_BOARDS, (req.body.MANAGE_GLOBAL_BOARDS != null));
	rolePermissions.set(Permissions.MANAGE_GLOBAL_SETTINGS, (req.body.MANAGE_GLOBAL_SETTINGS != null));
	rolePermissions.set(Permissions.MANAGE_BOARD_GENERAL, (req.body.MANAGE_BOARD_GENERAL != null));
	rolePermissions.set(Permissions.MANAGE_BOARD_OWNER, (req.body.MANAGE_BOARD_OWNER != null));
	rolePermissions.set(Permissions.MANAGE_BOARD_BANS, (req.body.MANAGE_BOARD_BANS != null));
	rolePermissions.set(Permissions.MANAGE_BOARD_LOGS, (req.body.MANAGE_BOARD_LOGS != null));
	rolePermissions.set(Permissions.MANAGE_BOARD_SETTINGS, (req.body.MANAGE_BOARD_SETTINGS != null));
	rolePermissions.set(Permissions.MANAGE_BOARD_CUSTOMISATION, (req.body.MANAGE_BOARD_CUSTOMISATION != null));
	rolePermissions.set(Permissions.MANAGE_BOARD_STAFF, (req.body.MANAGE_BOARD_STAFF != null));
	rolePermissions.set(Permissions.USE_MARKDOWN_PINKTEXT, (req.body.USE_MARKDOWN_PINKTEXT != null));
	rolePermissions.set(Permissions.USE_MARKDOWN_GREENTEXT, (req.body.USE_MARKDOWN_GREENTEXT != null));
	rolePermissions.set(Permissions.USE_MARKDOWN_BOLD, (req.body.USE_MARKDOWN_BOLD != null));
	rolePermissions.set(Permissions.USE_MARKDOWN_UNDERLINE, (req.body.USE_MARKDOWN_UNDERLINE != null));
	rolePermissions.set(Permissions.USE_MARKDOWN_STRIKETHROUGH, (req.body.USE_MARKDOWN_STRIKETHROUGH != null));
	rolePermissions.set(Permissions.USE_MARKDOWN_TITLE, (req.body.USE_MARKDOWN_TITLE != null));
	rolePermissions.set(Permissions.USE_MARKDOWN_ITALIC, (req.body.USE_MARKDOWN_ITALIC != null));
	rolePermissions.set(Permissions.USE_MARKDOWN_SPOILER, (req.body.USE_MARKDOWN_SPOILER != null));
	rolePermissions.set(Permissions.USE_MARKDOWN_MONO, (req.body.USE_MARKDOWN_MONO != null));
	rolePermissions.set(Permissions.USE_MARKDOWN_CODE, (req.body.USE_MARKDOWN_CODE != null));
	rolePermissions.set(Permissions.USE_MARKDOWN_DETECTED, (req.body.USE_MARKDOWN_DETECTED != null));
	rolePermissions.set(Permissions.USE_MARKDOWN_LINK, (req.body.USE_MARKDOWN_LINK != null));
	rolePermissions.set(Permissions.USE_MARKDOWN_DICE, (req.body.USE_MARKDOWN_DICE != null));
	rolePermissions.set(Permissions.USE_MARKDOWN_FORTUNE, (req.body.USE_MARKDOWN_FORTUNE != null));
	if (res.locals.permissions.get(Permissions.ROOT)) {
		rolePermissions.set(Permissions.MANAGE_GLOBAL_ACCOUNTS, (req.body.MANAGE_GLOBAL_ACCOUNTS != null));
		rolePermissions.set(Permissions.MANAGE_GLOBAL_ROLES, (req.body.MANAGE_GLOBAL_ROLES != null));
		rolePermissions.set(Permissions.ROOT, (req.body.ROOT != null));
	}
	rolePermissions.applyInheritance();

	const existingRoleName = roleManager.roleNameMap[rolePermissions.base64];
	if (existingRoleName) {
		return dynamicResponse(req, res, 409, 'message', {
			'title': 'Conflict',
			'error': `Another role already exists with those same permissions: "${existingRoleName}"`,
			'redirect': req.headers.referer || '/globalmanage/roles.html',
		});
	}

	const updated = await Roles.updateOne(req.body.roleid, rolePermissions).then(r => r.matchedCount);

	if (updated === 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'error': 'Role does not exist',
			'redirect': req.headers.referer || '/globalmanage/roles.html',
		});
	}

	const oldPermissions = new Permission(res.locals.editingRole.permissions);
	await Accounts.setNewRolePermissions(oldPermissions, rolePermissions);

	redis.redisPublisher.publish('roles', null);

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': 'Edited role',
		'redirect': `/globalmanage/editrole/${req.body.roleid}.html`,
	});

};
