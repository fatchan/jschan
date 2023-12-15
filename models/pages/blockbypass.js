'use strict';

const { buildBypass } = require(__dirname+'/../../lib/build/tasks.js');

module.exports = async (req, res, next) => {

	if (res.locals.minimal === true) {
		return res
			.set('Cache-Control', 'public, max-age=60')
			.render('bypass', {
				minimal: true
			});
	}

	let html;
	try {
		html = await buildBypass(res.locals.minimal);
	} catch (err) {
		return next(err);
	}

	return res.set('Cache-Control', 'max-age=0').send(html);

};
