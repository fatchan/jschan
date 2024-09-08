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
			// If perm has no "parents" bit list, or current user has at least one of the parent permissions, set each bit based on the form input
			const allowedParent = Metadata[bit].parents == null
				|| editorPermission.hasAny(...Metadata[bit].parents);
			if (allowedParent && !Metadata[bit].block) {
				this.set(parseInt(bit), (body[`permission_bit_${bit}`] != null));
			}
		}
	}

	applyInheritance() {
		if (this.get(Permissions.ROOT)) { //root gets all perms
			this.setAll(Permission.allPermissions);
		}
		if (this.get(Permissions.MANAGE_GLOBAL_BANS)) {
			this.set(Permissions.VIEW_BOARD_GLOBAL_BANS);
		}
	}

}

module.exports = Permission;
