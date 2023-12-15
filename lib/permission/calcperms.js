'use strict';

const { Permissions } = require(__dirname+'/permissions.js')
	, Permission = require(__dirname+'/permission.js')
	, roleManager = require(__dirname+'/rolemanager.js');

module.exports = (req, res) => {

	let calculatedPermissions;

	if (req.session && res.locals && res.locals.user) {

		//has a session and user, not anon, so their permissions from the db/user instead.
		const { user } = res.locals;
		calculatedPermissions = new Permission(user.permissions);

		//if they are on a board endpoint, also apply the board perms.
		if (res.locals.board != null) {
			if (res.locals.board.owner === user.username) {
				//they are board owner, give them board owner perms, in this board context
				calculatedPermissions.set(Permissions.MANAGE_BOARD_OWNER);
			} else if (res.locals.board.staff[user.username] != null) {
				//they are board staff, give them their board level staff perms, OR'd with account/global perms
				const boardPermissions = new Permission(res.locals.board.staff[user.username].permissions);
				for (let bit of Permissions._MANAGE_BOARD_BITS) {
					const inheritOrGlobal = calculatedPermissions.get(bit) || boardPermissions.get(bit);
					calculatedPermissions.set(bit, inheritOrGlobal);
				}
			}
			//and note, in future since we might need multiple-boards permission checks, we will have to change this.
			//could even build it with a map for each board, based on their stored permissions in that board, maybe like:
			//res.locals.boardPermissions[board] = new Permission(res.locals.board.settings.staff[user.username].permissions);
			//and then the MANAGE_BOARD_OWNER inheritance could be removed, since it should be set immutable
			//inside the board perms instead. and the existing code would make it for "global" BOs to have the permissions.
			//so we would remove the "...permissions.set(Permissions.MANAGE_BOARD_OWNER)..." above
		}

		//give ROOT all permission, BOARD_OWNER all MANAGE_BOARD*, etc
		calculatedPermissions.applyInheritance();

	} else {
		//not logged in, gets default anon permission
		calculatedPermissions = new Permission(roleManager.roles.ANON.base64);
	}

	return calculatedPermissions;

};
