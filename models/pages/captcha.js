'use strict';

const { Captchas, Ratelimits } = require(__dirname+'/../../db/')
	, { secureCookies, rateLimitCost, captchaOptions } = require(__dirname+'/../../configs/main.js')
	, generateCaptcha = require(__dirname+`/../../helpers/captcha/generators/${captchaOptions.type}.js`)
	, production = process.env.NODE_ENV === 'production';

module.exports = async (req, res, next) => {

	if (!production && req.cookies['captchaid'] != null) {
		return res.redirect(`/captcha/${req.cookies['captchaid']}.jpg`);
	}

	let captchaId;
	let maxAge = 5*60*1000;
	try {
		if (!res.locals.tor) {
			const ratelimit = await Ratelimits.incrmentQuota(res.locals.ip.single, 'captcha', rateLimitCost.captcha);
			if (ratelimit > 100) {
				return res.status(429).redirect('/file/ratelimit.png');
			}
		}
		let id;
		if ((await Captchas.db.estimatedDocumentCount()) >= captchaOptions.generateLimit) {
			//TODOs: round robin sample? store in redis? only sample random with longer than x expiry?
			const randomCaptcha = await Captchas.randomSample();
			id = randomCaptcha._id;
			maxAge = Math.abs((randomCaptcha.expireAt.getTime()+maxAge) - Date.now()); //abs in case mongo hasn't pruned, and will not be too big since it can't be too far away from pruning anyway
		} else {
			({ id } = await generateCaptcha());
		}
		captchaId = id;
	} catch (err) {
		return next(err);
	}

	return res
		.cookie('captchaid', captchaId.toString(), {
			'secure': production && secureCookies,
			'sameSite': 'strict',
			maxAge,
		})
		.redirect(`/captcha/${captchaId}.jpg`);

}
