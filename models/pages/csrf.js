'use strict';

module.exports = async (req, res) => {

	res.json({
		token: req.csrfToken(),
	});

};
