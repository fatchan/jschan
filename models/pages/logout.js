'use strict';

module.exports = (req, res, next) => {

	//remove session
	req.session.destroy();
	return res.redirect('/');

}
