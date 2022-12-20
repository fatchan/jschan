'use strict';

const Permissions = require(__dirname+'/permissions.js')
	, PermissionText = require(__dirname+'/permissiontext.js') //todo:combine^
	, BigBitfield = require('big-bitfield');

class Permission extends BigBitfield {

	constructor(data) {
		super(data);
	}

	static permissionEntries = Object.entries(Permissions)
		.filter(e => typeof e[1] === 'number');

	static allPermissions = this.permissionEntries
		.map(e => e[1]);

	toJSON() {
		return this.constructor.permissionEntries
			.reduce((acc, entry) => {
				const { label, desc, title, subtitle } = PermissionText[entry[0]];
				acc[entry[0]] = {
					bit: entry[1],
					state: this.get(entry[1]),
					label,
					desc,
					title,
					subtitle,
				};
				return acc;
			}, {});
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
