'use strict';

const { getInsecureTrip, getSecureTrip } = require(__dirname+'/tripcode.js')
	, { Permissions } = require(__dirname+'/../permission/permissions.js')
	, nameRegex = /^(?<name>[^#].*?)?(?:(?<tripcode>##(?<strip>[^ ].*?)|#(?<itrip>[^#].*?)))?(?<capcode>##(?<capcodetext> .*?)?)?$/
	, staffLevels = ['Admin', 'Global Staff', 'Board Owner', 'Board Mod']
	, staffLevelsRegex = new RegExp(`(${staffLevels.join('|')})+`, 'igm');

module.exports = async (inputName, permissions, boardSettings, boardOwner, boardStaff, username) => {

	const { forceAnon, defaultName } = boardSettings;
	const isBoardOwner = username === boardOwner; //why not just check staffboards and ownedboards?
	const staffUsernames = Object.keys(boardStaff);
	const isBoardMod = staffUsernames.includes(username);
	const staffPermissions = [permissions.get(Permissions.ROOT),
		permissions.get(Permissions.MANAGE_GLOBAL_GENERAL),
		isBoardOwner, isBoardMod];

	let name = defaultName;
	let tripcode = null;
	let capcode = null;
	if ((permissions.get(Permissions.MANAGE_BOARD_GENERAL) || !forceAnon) && inputName && inputName.length > 0) {
		// get matches with named groups for name, trip and capcode in 1 regex
		const matches = inputName.match(nameRegex);
		if (matches && matches.groups) {

			const groups = matches.groups;

			//name
			if (groups.name) {
				name = groups.name;
			}

			//tripcode
			if (groups.tripcode) {
				let tripcodeText = groups.strip || groups.itrip;
				if (!permissions.get(Permissions.MANAGE_BOARD_GENERAL) && groups.capcode === '##' && !groups.capcodetext) {
					//for the complaining non-staff troglodyte who puts the name as all #s
					tripcodeText = tripcodeText.concat('##');
				}
				if (groups.strip) {
					tripcode = `!!${(await getSecureTrip(tripcodeText))}`;
				} else if (groups.itrip) {
					tripcode = `!${getInsecureTrip(tripcodeText)}`;
				}
			}

			//capcode
			if (permissions.get(Permissions.MANAGE_BOARD_GENERAL) && groups.capcode) {
				let capcodeInput = groups.capcodetext ? groups.capcodetext.trim() : '';
				const { staffLevelDirect, staffLevelFallback } = staffPermissions.reduce((acc, sp, i) => {
					if (sp === true) {
						if (!acc.staffLevelFallback) {
							acc.staffLevelFallback = staffLevels[i];
						}
						if (!acc.staffLevelDirect && capcodeInput.toLowerCase().startsWith(staffLevels[i].toLowerCase())) {
							acc.staffLevelDirect = staffLevels[i];
						}
					}
					return acc;
				}, { 'staffLevelDirect': null, 'staffLevelFallback': null });
				//we still get the same fallbacks as before, its just more annoying without the direct permlevel mapping
				const staffLevel = staffLevelDirect ||
						(isBoardOwner ? staffLevels[2]
							: isBoardMod ? staffLevels[3]
								: staffLevelFallback);
				capcode = staffLevel;
				if (capcodeInput && capcodeInput.toLowerCase() !== staffLevel.toLowerCase()) {
					capcode = `${staffLevel} ${capcodeInput.replace(staffLevelsRegex, '').trim()}`;
				}
				capcode = `## ${capcode.trim()}`;
			}
		}
	}

	return { name, tripcode, capcode };

};
