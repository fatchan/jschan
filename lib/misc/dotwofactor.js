const OTPAuth = require('otpauth');

module.exports = (totpSecret, userInput) => {
	const totp = new OTPAuth.TOTP({
		secret: totpSecret,
		algorithm: 'SHA256',
	});
	const delta = totp.validate({
		token: userInput,
		algorithm: 'SHA256',
		window: 1,
	});
	return { totp, delta };
};
