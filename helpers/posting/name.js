'use strict';

const getTripCode = require(__dirname+'/tripcode.js')
	, nameRegex = /^(?<name>(?!##).*?)?(?:##(?<tripcode>[^ ]{1}.*?))?(?<capcode>##(?<capcodetext> .*?)?)?$/
	, capcodeLevels = ['Admin', 'Global Staff', 'Board Owner', 'Board Mod'];

module.exports = async (inputName, permLevel, boardSettings) => {

	const { forceAnon, defaultName } = boardSettings;

	let name = defaultName;
	let tripcode = null;
	let capcode = null;
	if ((permLevel < 4 || !forceAnon) && inputName && inputName.length > 0) {
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
				tripcode = `!!${(await getTripCode(groups.tripcode))}`;
			}
			//capcode
			if (permLevel < 4 && groups.capcode) {
				let type = capcodeLevels[permLevel];
				capcode = groups.capcodetext ? groups.capcodetext.trim() : type;
				if (type.toLowerCase() === capcode.toLowerCase()) {
					capcode = type;
				} else {
					capcode = `${type} ${capcode}`;
				}
				capcode = `## ${capcode}`;
			}
		}
	}

	return { name, tripcode, capcode };

}
