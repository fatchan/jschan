'use strict';

const { buildModLogList } = require(__dirname+'/../../lib/build/tasks.js');

module.exports = async (req, res, next) => {

	let html, json;
	try {
		({ html, json } = await buildModLogList({ board: res.locals.board }));
	} catch (err) {
		return next(err);
	}

	if (req.path.endsWith('.json')) {
		return res.set('Cache-Control', 'max-age=0').json(json);
	} else {
		return res.set('Cache-Control', 'max-age=0').send(html);
	}

};
