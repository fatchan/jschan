'use strict';

module.exports = async (req, res, next) => {

	res.json({
		token: req.csrfToken(),
	});

}
