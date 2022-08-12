'use strict';

const { buildGlobalSettings } = require(__dirname+'/../../lib/build/tasks.js');

module.exports = async (req, res, next) => {

	let json;
	try {
		json = await buildGlobalSettings();
	} catch (err) {
		return next(err);
	}

	return res.json(json);

};
