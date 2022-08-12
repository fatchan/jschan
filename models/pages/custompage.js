'use strict';

const { buildCustomPage } = require(__dirname+'/../../lib/build/tasks.js');

module.exports = async (req, res, next) => {

	let html, json;
	try {
		({ html, json } = await buildCustomPage({ ...req.params, board: res.locals.board }));
	} catch (err) {
		return next(err);
	}

	if (!html) {
		return next();
	}

	if (req.path.endsWith('.json')) {
		return res.json(json);
	} else {
		return res.send(html);
	}

};
