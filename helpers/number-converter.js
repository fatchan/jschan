'use strict';

module.exports = (req, res, next) => {

	//for body
	if (req.body.thread) {
		req.body.thread = +req.body.thread;
	}
	if (req.body.checkedposts) {
		//syntax tries to convert all string to number
		req.body.checkedposts = req.body.checkedposts.map(Number);
	}

	//and for params
	if (req.params.id) {
		req.params.id = +req.params.id;
	}
	if (req.params.page) {
		req.params.page = +req.params.page;
	}

	//and query
	if (req.query.p) {
		const pnum = +req.query.p;
		if (Number.isSafeInteger(pnum)) {
			req.query.p = +req.query.p;
		} else {
			req.query.p = null;
		}
	}

	next();

}
