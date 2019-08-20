'use strict';

const { buildCatalog } = require(__dirname+'/../../helpers/build.js');

module.exports = async (req, res, next) => {

	let html;
    try {
		html = await buildCatalog(res.locals.board);
    } catch (err) {
        return next(err);
    }

	return res.send(html);

}
