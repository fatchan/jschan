'use strict';

const { buildBoardSettings } = require(__dirname+'/../../lib/build/tasks.js');

module.exports = async (req, res, next) => {

	let json;
	try {
		json = await buildBoardSettings({ board: res.locals.board });
	} catch (err) {
		return next(err);
	}

	return res.json(json);

};
