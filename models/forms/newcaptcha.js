'use strict';

module.exports = (req, res) => {

	res.clearCookie('captchaid');
	return res.redirect('/captcha.html');

};
