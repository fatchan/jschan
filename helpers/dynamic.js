'use strict';

module.exports = (req, res, code, page, data) => {
	if (req.body.minimal) {
		data.minimal = true;
	}
	res.status(code);
	if (req.headers['x-using-xhr'] != null) {
		return res.json(data);
	} else {
		return res.render(page, data);
	}
}
