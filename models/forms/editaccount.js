'use strict';

const { Accounts } = require(__dirname+'/../../db/')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, Permissions = require(__dirname+'/../../lib/permission/permissions.js')
	, Permission = require(__dirname+'/../../lib/permission/permission.js');

module.exports = async (req, res) => {

	let updatingPermissions;

	if (req.body.template) {
		updatingPermissions = new Permission(req.body.template);
	} else {
		updatingPermissions = new Permission(res.locals.editingAccount.permissions);
		updatingPermissions.set(Permissions.VIEW_RAW_IP, (req.body.VIEW_RAW_IP != null));
		updatingPermissions.set(Permissions.CREATE_BOARD, (req.body.CREATE_BOARD != null));
		updatingPermissions.set(Permissions.CREATE_ACCOUNT, (req.body.CREATE_ACCOUNT != null));
		updatingPermissions.set(Permissions.BYPASS_BANS, (req.body.BYPASS_BANS != null));
		updatingPermissions.set(Permissions.BYPASS_SPAMCHECK, (req.body.BYPASS_SPAMCHECK != null));
		updatingPermissions.set(Permissions.BYPASS_RATELIMITS, (req.body.BYPASS_RATELIMITS != null));
		updatingPermissions.set(Permissions.BYPASS_FILTERS, (req.body.BYPASS_FILTERS != null));
		updatingPermissions.set(Permissions.MANAGE_GLOBAL_GENERAL, (req.body.MANAGE_GLOBAL_GENERAL != null));
		updatingPermissions.set(Permissions.MANAGE_GLOBAL_BANS, (req.body.MANAGE_GLOBAL_BANS != null));
		updatingPermissions.set(Permissions.MANAGE_GLOBAL_LOGS, (req.body.MANAGE_GLOBAL_LOGS != null));
		updatingPermissions.set(Permissions.MANAGE_GLOBAL_NEWS, (req.body.MANAGE_GLOBAL_NEWS != null));
		updatingPermissions.set(Permissions.MANAGE_GLOBAL_BOARDS, (req.body.MANAGE_GLOBAL_BOARDS != null));
		updatingPermissions.set(Permissions.MANAGE_GLOBAL_SETTINGS, (req.body.MANAGE_GLOBAL_SETTINGS != null));
		updatingPermissions.set(Permissions.MANAGE_BOARD_GENERAL, (req.body.MANAGE_BOARD_GENERAL != null));
		updatingPermissions.set(Permissions.MANAGE_BOARD_OWNER, (req.body.MANAGE_BOARD_OWNER != null));
		updatingPermissions.set(Permissions.MANAGE_BOARD_BANS, (req.body.MANAGE_BOARD_BANS != null));
		updatingPermissions.set(Permissions.MANAGE_BOARD_LOGS, (req.body.MANAGE_BOARD_LOGS != null));
		updatingPermissions.set(Permissions.MANAGE_BOARD_SETTINGS, (req.body.MANAGE_BOARD_SETTINGS != null));
		updatingPermissions.set(Permissions.MANAGE_BOARD_CUSTOMISATION, (req.body.MANAGE_BOARD_CUSTOMISATION != null));
		updatingPermissions.set(Permissions.MANAGE_BOARD_STAFF, (req.body.MANAGE_BOARD_STAFF != null));
		updatingPermissions.set(Permissions.USE_MARKDOWN_PINKTEXT, (req.body.USE_MARKDOWN_PINKTEXT != null));
		updatingPermissions.set(Permissions.USE_MARKDOWN_GREENTEXT, (req.body.USE_MARKDOWN_GREENTEXT != null));
		updatingPermissions.set(Permissions.USE_MARKDOWN_BOLD, (req.body.USE_MARKDOWN_BOLD != null));
		updatingPermissions.set(Permissions.USE_MARKDOWN_UNDERLINE, (req.body.USE_MARKDOWN_UNDERLINE != null));
		updatingPermissions.set(Permissions.USE_MARKDOWN_STRIKETHROUGH, (req.body.USE_MARKDOWN_STRIKETHROUGH != null));
		updatingPermissions.set(Permissions.USE_MARKDOWN_TITLE, (req.body.USE_MARKDOWN_TITLE != null));
		updatingPermissions.set(Permissions.USE_MARKDOWN_ITALIC, (req.body.USE_MARKDOWN_ITALIC != null));
		updatingPermissions.set(Permissions.USE_MARKDOWN_SPOILER, (req.body.USE_MARKDOWN_SPOILER != null));
		updatingPermissions.set(Permissions.USE_MARKDOWN_MONO, (req.body.USE_MARKDOWN_MONO != null));
		updatingPermissions.set(Permissions.USE_MARKDOWN_CODE, (req.body.USE_MARKDOWN_CODE != null));
		updatingPermissions.set(Permissions.USE_MARKDOWN_DETECTED, (req.body.USE_MARKDOWN_DETECTED != null));
		updatingPermissions.set(Permissions.USE_MARKDOWN_LINK, (req.body.USE_MARKDOWN_LINK != null));
		updatingPermissions.set(Permissions.USE_MARKDOWN_DICE, (req.body.USE_MARKDOWN_DICE != null));
		updatingPermissions.set(Permissions.USE_MARKDOWN_FORTUNE, (req.body.USE_MARKDOWN_FORTUNE != null));
		if (res.locals.permissions.get(Permissions.ROOT)) {
			updatingPermissions.set(Permissions.MANAGE_GLOBAL_ACCOUNTS, (req.body.MANAGE_GLOBAL_ACCOUNTS != null));
			updatingPermissions.set(Permissions.MANAGE_GLOBAL_ROLES, (req.body.MANAGE_GLOBAL_ROLES != null));
			updatingPermissions.set(Permissions.ROOT, (req.body.ROOT != null));
		}
	}
	updatingPermissions.applyInheritance();

	const updated = await Accounts.setAccountPermissions(req.body.username, updatingPermissions).then(r => r.matchedCount);

	if (updated === 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': 'Bad request',
			'errors': 'Account does not exist',
			'redirect': req.headers.referer || '/globalmanage/accounts.html',
		});
	}

	return dynamicResponse(req, res, 200, 'message', {
		'title': 'Success',
		'message': 'Edited account',
		'redirect': `/globalmanage/editaccount/${req.body.username}.html`,
	});

};
