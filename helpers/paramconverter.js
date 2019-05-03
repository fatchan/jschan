'use strict';

const Mongo = require(__dirname+'/../db/db.js');

module.exports = (req, res, next) => {

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
	next();

}
