'use strict';

module.exports = async (req, res, next) => {

	return res.render('account', {
		user: req.session.user		
	});

}
