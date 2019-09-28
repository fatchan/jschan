'use strict';

module.exports = (req, res, code, page, data) => {
	res.status(code);
	if (req.headers['x-using-xhr'] != null) {
		if (data.messages)	{
			data.message = data.messages.join('\n');
		}
		if (data.errors) {
			data.message = data.errors.join('\n');
		}
		return res.json(data);
	} else {
		return res.render(page, data);
	}
}
