'use strict';

const { buildBanners } = require(__dirname+'/../../lib/build/tasks.js');

module.exports = async (req, res, next) => {

	let html, json;
	try {
		({ html, json } = await buildBanners({ board: res.locals.board }));
	} catch (err) {
		return next(err);
	}

	if (req.path.endsWith('.json')) {
		return res.json(json);
	} else {
		return res.send(html);
	}

};
