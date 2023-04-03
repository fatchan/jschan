const OTPAuth = require('otpauth')
	, redis = require(__dirname+'/../redis/redis.js');

module.exports = async (username, totpSecret, userInput) => {

	const totp = new OTPAuth.TOTP({
		secret: totpSecret,
		algorithm: 'SHA256',
	});

	let delta = totp.validate({
		token: userInput,
		algorithm: 'SHA256',
		window: 1,
	});

	if (delta !== null) {
		const key = `twofactor_success:${username}:${userInput}`;
		const uses = await redis.incr(key);
		redis.expire(key, 30);
		if (uses && uses > 1) {
			return null;
		}
	}

	return delta;

};
