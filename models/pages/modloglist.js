'use strict';

const { buildModLogList } = require(__dirname+'/../../helpers/tasks.js');

module.exports = async (req, res, next) => {

	let html;
	try {
		html = await buildModLogList({ board: res.locals.board });
	} catch (err) {
		return next(err);
	}

	return res.send(html);

}
