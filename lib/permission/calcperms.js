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
		let boardPermissions, boardRolePermission;
		if (res.locals.board != null) {
			if (res.locals.board.owner === user.username) {
				//they are board owner, give them board owner perms, in this board context
				calculatedPermissions.set(Permissions.MANAGE_BOARD_OWNER);
				boardPermissions = new Permission(res.locals.board.staff[user.username].permissions);
				boardRolePermission = roleManager.roles.BOARD_OWNER;
			} else if (res.locals.board.staff[user.username] != null) {
				//they are a board staff
				boardPermissions = new Permission(res.locals.board.staff[user.username].permissions);
				boardRolePermission = roleManager.roles.BOARD_STAFF;
			}
			if (boardPermissions) {
				//set their board level perms calculated from boardPermissions and boardRolePermission bits in _MANAGE_BOARD_BITS
				for (let bit of Permissions._MANAGE_BOARD_BITS) {
					const inheritOrGlobal = calculatedPermissions.get(bit)	//if they've been given the perm on their account (applies globally), or non-board role (including "global" BO/staffs)
						|| (boardPermissions.get(bit) 						//OR they have the bit on the board
							&& boardRolePermission.get(bit));				//and the "Board owner"/"Board staff" role doesn't have it unchecked globally
					calculatedPermissions.set(bit, inheritOrGlobal);		//set the inherited board permission bit
				}
			}

			//TODO: multi-board perms, note below comment maybe outdated, keeping for posterity
			//and note, in future since we might need multiple-boards permission checks, we will have to change this.
			//could even build it with a map for each board, based on their stored permissions in that board, maybe like:
			//res.locals.boardPermissions[board] = new Permission(res.locals.board.settings.staff[user.username].permissions);
			//and then the MANAGE_BOARD_OWNER inheritance could be removed, since it should be set immutable
			//inside the board perms instead. and the existing code would make it for "global" BOs to have the permissions.
			//so we would remove the "...permissions.set(Permissions.MANAGE_BOARD_OWNER)..." above

		}

		//give ROOT all permission, MANAGE_GLOBAL_BANS perms for VIEW_BOARD_GLOBAL_BANS, etc
		calculatedPermissions.applyInheritance();

	} else {
		//not logged in, gets default anon permission
		calculatedPermissions = new Permission(roleManager.roles.ANON.base64);
	}

	return calculatedPermissions;

};
