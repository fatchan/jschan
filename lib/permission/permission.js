'use strict';

const { Permissions, Metadata } = require(__dirname+'/permissions.js')
	, BigBitfield = require('big-bitfield');

class Permission extends BigBitfield {

	constructor(data) {
		super(data);
	}

	// List of permission bits
	static allPermissions = Object.values(Permissions)
		.filter(e => typeof e[1] === 'number');

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
	handleBody(body, editorPermission) {
		for (let bit in Metadata) {
			// If perm has no "parent" bit, or current user has the parent permission, set each bit based on the form input
			const allowedParent = !Metadata[bit].parent
				|| editorPermission.get(Metadata[bit].parent);
			if (allowedParent) {
				this.set(parseInt(bit), (body[`permission_bit_${bit}`] != null));
			}
		}
	}

	applyInheritance() {
		if (this.get(Permissions.ROOT)){ //root gets all perms
			this.setAll(this.constructor.allPermissions);
		} else if (this.get(Permissions.MANAGE_BOARD_OWNER)) { //BOs and "global staff"
			this.setAll(Permissions._MANAGE_BOARD_BITS);
		}
	}

}

module.exports = Permission;
