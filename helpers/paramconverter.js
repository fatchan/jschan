'use strict';

const Mongo = require(__dirname+'/../db/db.js')
	, allowedArrays = new Set(['checkedposts', 'globalcheckedposts', 'checkedbans', 'checkedbanners'])

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

	//thread in post form
	if (req.params.id) {
		req.params.id = +req.params.id;
	}
	if (req.body.thread) {
		req.body.thread = +req.body.thread;
	}

	//page number
	if (req.query.p) {
		const num = parseInt(req.query.p);
		if (Number.isSafeInteger(num)) {
			req.query.p = num;
		} else {
			req.query.p = null;
		}
	}

	//board settings
	if (req.body.reply_limit != null) {
		const num = parseInt(req.body.reply_limit);
		if (Number.isSafeInteger(num)) {
			req.body.reply_limit = num;
		} else {
			req.body.reply_limit = null;
		}
	}
	if (req.body.max_files != null) {
		const num = parseInt(req.body.max_files);
		if (Number.isSafeInteger(num)) {
			req.body.max_files = num;
		} else {
			req.body.max_files = null;
		}
	}
	if (req.body.thread_limit != null) {
		const num = +parseInt(req.body.thread_limit);
		if (Number.isSafeInteger(num)) {
			req.body.thread_limit = num;
		} else {
			req.body.thread_limit = null;
		}
	}

	if (req.params.page) {
		req.params.page = req.params.page === 'index' ? 'index' : +req.params.page;
	}

	next();

}
