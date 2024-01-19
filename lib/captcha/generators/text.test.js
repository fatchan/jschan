const generateCaptcha = require('./text.js');

describe('generate text captcha', () => {
	const cases = [
		{ name: 'text captcha', font: 'default', text: { wave: 0, line: false, paint: 0, noise: 0 }, numDistorts: { min: 0, max: 1 }, distortion: 0 },
		{ name: 'text captcha with distortion', font: 'default', text: { wave: 0, line: false, paint: 0, noise: 0 }, numDistorts: { min: 1, max: 10 }, distortion: 10 },
		{ name: 'text captcha with wave', font: 'default', text: { wave: 5, line: false, paint: 0, noise: 0 }, numDistorts: { min: 0, max: 1 }, distortion: 0 },
		{ name: 'text captcha with line', font: 'default', text: { wave: 0, line: true, paint: 0, noise: 0 }, numDistorts: { min: 0, max: 1 }, distortion: 0 },
		{ name: 'text captcha with paint', font: 'default', text: { wave: 0, line: false, paint: 5, noise: 0 }, numDistorts: { min: 0, max: 1 }, distortion: 0 },
		{ name: 'text captcha with noise', font: 'default', text: { wave: 0, line: false, paint: 0, noise: 5 }, numDistorts: { min: 0, max: 1 }, distortion: 0 },
		{ name: 'text captcha with with all effects and distortion', font: 'default', text: { wave: 5, line: true, paint: 5, noise: 5 }, numDistorts: { min: 1, max: 10 }, distortion: 10 },
		{ name: 'text captcha with non-default font', font: '/usr/share/fonts/type1/gsfonts/p052003l.pfb', text: { wave: 0, line: false, paint: 0, noise: 0 }, numDistorts: { min: 0, max: 1 }, distortion: 0 },
		{ name: 'text captcha with all the above', font: '/usr/share/fonts/type1/gsfonts/p052003l.pfb', text: { wave: 5, line: true, paint: 5, noise: 5 }, numDistorts: { min: 1, max: 10 }, distortion: 10 },
	];
	for (let captchaOptions of cases) {	
		test(captchaOptions.name, async () => {
			const { captcha } = await generateCaptcha(captchaOptions);
			expect(await new Promise((res, rej) => {
				captcha.write('/tmp/captcha.jpg', (err) => {
					if (err) {
						return rej(err);
					}
					res();
				});
			}));
		});
	}
});
