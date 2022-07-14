'use strict';

const { Captchas, Ratelimits } = require(__dirname+'/../../db/')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, uploadDirectory = require(__dirname+'/../../lib/file/uploaddirectory.js')
	, production = process.env.NODE_ENV === 'production';

module.exports = async (req, res, next) => {

	const { secureCookies, rateLimitCost, captchaOptions } = config.get;
	if (!['text', 'grid', 'grid2'].includes(captchaOptions.type)) {
		return next(); //only grid and text captcha continue
	}

	const generateCaptcha = require(__dirname+`/../../lib/captcha/generators/${captchaOptions.type}.js`);

	if (!production && req.cookies['captchaid'] != null) {
		return res.redirect(`/captcha/${req.cookies['captchaid']}.jpg`);
	}

	let captchaId;
	let maxAge = 5*60*1000;
	try {
		if (!res.locals.anonymizer) {
			const ratelimit = await Ratelimits.incrmentQuota(res.locals.ip.cloak, 'captcha', rateLimitCost.captcha);
			if (ratelimit > 100) {
				return res.status(429).redirect('/file/ratelimit.png');
			}
		}
		const captchaCount = await Captchas.db.estimatedDocumentCount();
		if (captchaCount >= captchaOptions.generateLimit) {
			const captchaSample = await Captchas.randomSample();
			const randomCaptcha = captchaSample[0];
			captchaId = randomCaptcha._id;
			maxAge = Math.abs((randomCaptcha.expireAt.getTime()+maxAge) - Date.now()); //abs in case mongo hasn't pruned, and will not be too big since it can't be too far away from pruning anyway
		} else {
			const { captcha, solution } = await generateCaptcha(captchaOptions);
			captchaId = await Captchas.insertOne(solution).then(r => r.insertedId);
			//captcha.write doesn't like to be util.promisify'd
			await (new Promise((resolve, reject) => {
				captcha.write(`${uploadDirectory}/captcha/${captchaId}.jpg`, (err) => {
					if (err) {
						return reject(err);
					}
					resolve();
				});
			}));
		}
	} catch (err) {
		return next(err);
	}

	return res
		.cookie('captchaid', captchaId.toString(), {
			'secure': production && secureCookies && (req.headers['x-forwarded-proto'] === 'https'),
			'sameSite': 'strict',
			maxAge,
		})
		.redirect(`/captcha/${captchaId}.jpg`);

};
