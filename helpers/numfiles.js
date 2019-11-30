'use strict';

module.exports = (req, res, next) => {
	res.locals.numFiles = 0;
	if (req.files && req.files.file) {
		if (Array.isArray(req.files.file)) {
			res.locals.numFiles = req.files.file.filter(file => file.size > 0).length;
		} else {
			res.locals.numFiles = req.files.file.size > 0 ? 1 : 0;
			req.files.file = [req.files.file];
		}
	}
	next();
}
