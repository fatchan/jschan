'use strict';

module.exports = (req, res, next) => {

	//for body
	if (req.body.thread) {
		req.body.thread = +req.body.thread;
	}
	if (req.body.checked) {
		//syntax casts all string to number
		req.body.checked = req.body.checked.map(Number);
	}

	//and for params
	if (req.params.id) {
		req.params.id = +req.params.id;
	}
	if (req.params.page) {
		req.params.page = +req.params.page;
	}

	next();

}
