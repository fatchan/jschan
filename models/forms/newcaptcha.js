'use strict';

module.exports = (req, res, next) => {

	res.clearCookie('captchaid');
	return res.redirect('/captcha.html');

}
