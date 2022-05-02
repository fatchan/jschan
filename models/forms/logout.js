'use strict';

module.exports = (req, res) => {

	//remove session
	req.session.destroy();
	return res.redirect('/');

};
