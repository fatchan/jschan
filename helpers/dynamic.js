'use strict';

module.exports = (req, res, code, page, data) => {
	res.status(code);
	if (req.headers['x-using-xhr'] != null) {
		return res.json(data);
	} else {
		return res.render(page, data);
	}
}
