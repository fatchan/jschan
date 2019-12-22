'use strict';

const { Ratelimits } = require(__dirname+'/../../db/')
	, generateCaptcha = require(__dirname+'/../../helpers/captcha/captchagenerate.js')
	, { secureCookies } = require(__dirname+'/../../configs/main.js')
	, production = process.env.NODE_ENV === 'production';

module.exports = async (req, res, next) => {

	if (!production && req.cookies['captchaid'] != null) {
		return res.redirect(`/captcha/${req.cookies['captchaid']}.jpg`);
	}

	let captchaId;
	try {
		const ratelimit = await Ratelimits.incrmentQuota(res.locals.ip.hash, 'captcha', 10);
		if (ratelimit > 100) {
			return res.status(429).redirect('/img/ratelimit.png');
		}
		const { id, text } = await generateCaptcha();
		captchaId = id;
	} catch (err) {
		return next(err);
	}

	return res
		.cookie('captchaid', captchaId.toString(), {
			'maxAge': 5*60*1000, //5 minute cookie
			'secure': production && secureCookies,
			'sameSite': 'strict'
		})
		.redirect(`/captcha/${captchaId}.jpg`);

}
