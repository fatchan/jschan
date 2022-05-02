'use strict';

module.exports = async (req, res) => {

	res.render('login', {
		'goto': (typeof req.query.goto === 'string' ? req.query.goto : null)
	});

};
