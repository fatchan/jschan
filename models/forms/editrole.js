'use strict';

const { Roles, Accounts } = require(__dirname+'/../../db/')
	, redis = require(__dirname+'/../../lib/redis/redis.js')
	, dynamicResponse = require(__dirname+'/../../lib/misc/dynamic.js')
	, roleManager = require(__dirname+'/../../lib/permission/rolemanager.js')
	, Permission = require(__dirname+'/../../lib/permission/permission.js');

module.exports = async (req, res) => {

	const { __ } = res.locals;
	let rolePermissions = new Permission(res.locals.editingRole.permissions);
	rolePermissions.handleBody(req.body, res.locals.permissions);
	// rolePermissions.applyInheritance();

	const existingRoleName = roleManager.rolePermissionMap[rolePermissions.base64];
	if (existingRoleName) {
		return dynamicResponse(req, res, 409, 'message', {
			'title': __('Conflict'),
			'error': __('Another role already exists with the same permissions: "%s"', existingRoleName),
			'redirect': req.headers.referer || '/globalmanage/roles.html',
		});
	}

	const updated = await Roles.updateOne(req.body.roleid, rolePermissions).then(r => r.matchedCount);

	if (updated === 0) {
		return dynamicResponse(req, res, 400, 'message', {
			'title': __('Bad request'),
			'error': __('Role does not exist'),
			'redirect': req.headers.referer || '/globalmanage/roles.html',
		});
	}

	const oldPermissions = new Permission(res.locals.editingRole.permissions);
	await Accounts.setNewRolePermissions(oldPermissions, rolePermissions);

	redis.redisPublisher.publish('roles', null);

	return dynamicResponse(req, res, 200, 'message', {
		'title': __('Success'),
		'message': __('Edited role'),
		'redirect': `/globalmanage/editrole/${req.body.roleid}.html`,
	});

};
