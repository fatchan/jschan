'use strict';

module.exports = (req, res, code, page, data) => {
	if (req.body.minimal) {
		data.minimal = true;
	}
	res.status(code);
	if (req.headers['x-using-xhr'] != null && !req.body.minimal) {
		//if sending header with js, and not a bypass_minimal page, show modal
		return res.json(data);
	} else {
		return res.render(page, data);
	}
}
