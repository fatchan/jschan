'use strict';

const { Permissions, Metadata } = require(__dirname+'/permissions.js')
	, BigBitfield = require('big-bitfield');

class Permission extends BigBitfield {

	constructor(data) {
		super(data);
	}

	// List of permission bits
	static allPermissions = Object.values(Permissions)
		.filter(v => typeof v === 'number');

	// Convert to a map of bit to metadata and state, for use in templates
	toJSON() {
		return Object.entries(Metadata)
			.reduce((acc, entry) => {
				acc[entry[0]] = {
					state: this.get(entry[0]),
					...entry[1],
				};
				return acc;
			}, {});
	}

	// Update permission based on body and another users permission
	handleBody(body, editorPermission, boardOnly=false) {
		const handlingBits = boardOnly ? Permissions._MANAGE_BOARD_BITS : Object.keys(Metadata);
		for (let bit of handlingBits) {
			// If perm has no "parent" bit, or current user has the parent permission, set each bit based on the form input
			const allowedParent = Metadata[bit].parent == null
				|| editorPermission.get(Metadata[bit].parent);
			if (allowedParent && !Metadata[bit].block) {
				this.set(parseInt(bit), (body[`permission_bit_${bit}`] != null));
			}
		}
	}

	applyInheritance() {
		if (this.get(Permissions.ROOT)) { //root gets all perms
			this.setAll(Permission.allPermissions);
		} else if (this.get(Permissions.MANAGE_BOARD_OWNER)) { //BOs and "global staff"
			this.setAll(Permissions._MANAGE_BOARD_BITS);
		}
		if (this.get(Permissions.MANAGE_GLOBAL_BANS)) {
			this.set(Permissions.VIEW_BOARD_GLOBAL_BANS);
		}
	}

}

module.exports = Permission;
