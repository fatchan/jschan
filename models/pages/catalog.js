'use strict';

const { buildCatalog } = require(__dirname+'/../../helpers/tasks.js');

module.exports = async (req, res, next) => {

	let html;
	try {
		({ html } = await buildCatalog({ board: res.locals.board }));
	} catch (err) {
		return next(err);
	}

	if (req.path.endsWith('.json')) {
		return res.json(json);
	} else {
		return res.send(html);
	}

}
