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
				acc[entry[0]] = {
					bit: entry[1],
					state: this.get(entry[1]),
					label: PermissionText[entry[0]].label,
					desc: PermissionText[entry[0]].desc,
					title: PermissionText[entry[0]].title,
				};
				return acc;
			}, {});
	}

	applyInheritance() {
		if (this.get(Permissions.ROOT)){ //root gets all perms
			this.setAll(this.constructor.allPermissions);
		} else if (this.get(Permissions.MANAGE_BOARD_OWNER)) { //BOs and "global staff"
			this.setAll([
				Permissions.MANAGE_BOARD_GENERAL, Permissions.MANAGE_BOARD_BANS, 
				Permissions.MANAGE_BOARD_LOGS, Permissions.MANAGE_BOARD_SETTINGS, 
				Permissions.MANAGE_BOARD_CUSTOMISATION, Permissions.MANAGE_BOARD_STAFF,
			]);
		}
	}

};

module.exports = Permission;
