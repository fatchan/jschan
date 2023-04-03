'use strict';

module.exports = (req, res, code, page, data) => {

	res.status(code);

	if (req.body.minimal) {
		data.minimal = true;
	}

	if (req.headers && req.headers['x-using-xhr'] != null) {
		//if sending header with js, and not a bypass_minimal page, show modal
		return res.json(data);
	} else {
		return res.render(page, data);
	}

};
