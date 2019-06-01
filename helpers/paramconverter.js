'use strict';

const Mongo = require(__dirname+'/../db/db.js')
	, allowedArrays = new Set(['checkedposts', 'globalcheckedposts', 'checkedbans', 'checkedbanners'])
	, numberFields = ['reply_limit', 'max_files', 'thread_limit', 'thread']

module.exports = (req, res, next) => {

	const bodyfields = Object.keys(req.body);
	for (let i = 0; i < bodyfields.length; i++) {
		const key = bodyfields[i];
		const val = req.body[key];
		if (!allowedArrays.has(key) && Array.isArray(val)) {
			//this is an array from malformed input, deny it.
			return res.status(400).render('message', {
				'title': 'Bad request',
				'message': 'Malformed input'
			});
		}
	}

	//convert to numbers of mongoIds for action routes
	if (req.body.checkedposts) {
		req.body.checkedposts = req.body.checkedposts.map(Number);
	}
	if (req.body.globalcheckedposts) {
		req.body.globalcheckedposts = req.body.globalcheckedposts.map(Mongo.ObjectId)
	}
	if (req.params.id) {
		req.params.id = +req.params.id;
	}

	for (let i = 0; i < numberFields.length; i++) {
		const field = numberFields[i];
		if (req.body[field]) {
			const num = parseInt(req.body[field]);
			if (Number.isSafeInteger(num)) {
				req.body[field] = num;
			} else {
				req.body[field] = null;
			}
		}
	}

	if (req.params.page) {
		req.params.page = req.params.page === 'index' ? 'index' : +req.params.page;
	}

	next();

}
