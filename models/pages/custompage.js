'use strict';

const { buildCustomPage } = require(__dirname+'/../../helpers/tasks.js');

module.exports = async (req, res, next) => {

	let html;
	try {
		html = await buildCustomPage(req.params);
	} catch (err) {
		return next(err);
	}

	if (!html) {
		return res.status(404).render('404');
	}

	return res.send(html);

}
