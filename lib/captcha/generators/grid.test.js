const gridv1 = require('./grid.js')
	, gridv2 = require('./grid2.js') 
	, falses = ['○','□','♘','♢','▽','△','♖','✧','♔','♘','♕','♗','♙','♧']
	, trues = ['●','■','♞','♦','▼','▲','♜','✦','♚','♞','♛','♝','♟','♣'];

const cases = [
	{ name: '3n grid captcha', font: 'default', grid: { falses, trues, question: 'whatever', size: 3, imageSize: 120, iconYOffset: 0, edge: 0, noise: 0 }, numDistorts: { min: 0, max: 1 }, distortion: 0 },
	{ name: '4n grid captcha', font: 'default', grid: { falses, trues, question: 'whatever', size: 4, imageSize: 120, iconYOffset: 0, edge: 0, noise: 0 }, numDistorts: { min: 0, max: 1 }, distortion: 0 },
	{ name: '6n grid captcha', font: 'default', grid: { falses, trues, question: 'whatever', size: 6, imageSize: 120, iconYOffset: 0, edge: 0, noise: 0 }, numDistorts: { min: 0, max: 1 }, distortion: 0 },
	{ name: '4n grid captcha with distortion', font: 'default', grid: { falses, trues, question: 'whatever', size: 4, imageSize: 120, iconYOffset: 0, edge: 0, noise: 0 }, numDistorts: { min: 1, max: 10 }, distortion: 10 },
	{ name: '4n grid captcha with edge', font: 'default', grid: { falses, trues, question: 'whatever', size: 4, imageSize: 120, iconYOffset: 0, edge: 10, noise: 0 }, numDistorts: { min: 0, max: 1 }, distortion: 0 },
	{ name: '4n grid captcha with noise', font: 'default', grid: { falses, trues, question: 'whatever', size: 4, imageSize: 120, iconYOffset: 0, edge: 0, noise: 10 }, numDistorts: { min: 0, max: 1 }, distortion: 0 },
	{ name: '4n grid captcha with y offset', font: 'default', grid: { falses, trues, question: 'whatever', size: 4, imageSize: 120, iconYOffset: 15, edge: 0, noise: 0 }, numDistorts: { min: 0, max: 1 }, distortion: 0 },
	{ name: '4n grid captcha with all effects', font: 'default', grid: { falses, trues, question: 'whatever', size: 4, imageSize: 120, iconYOffset: 0, edge: 0, noise: 0 }, numDistorts: { min: 0, max: 1 }, distortion: 0 },
	{ name: '4n grid captcha with all effects and distortion', font: 'default', grid: { falses, trues, question: 'whatever', size: 4, imageSize: 120, iconYOffset: 150, edge: 10, noise: 10 }, numDistorts: { min: 1, max: 10 }, distortion: 10 },
	{ name: '250px 6n grid captcha with all effects and distortion', font: 'default', grid: { falses, trues, question: 'whatever', size: 6, imageSize: 250, iconYOffset: 150, edge: 10, noise: 10 }, numDistorts: { min: 1, max: 10 }, distortion: 10 },
	{ name: '123px 4n grid captcha with all effects and distortion', font: 'default', grid: { falses, trues, question: 'whatever', size: 4, imageSize: 123, iconYOffset: 150, edge: 10, noise: 10 }, numDistorts: { min: 1, max: 10 }, distortion: 10 },
	{ name: '90px 3n grid captcha with all effects and distortion', font: 'default', grid: { falses, trues, question: 'whatever', size: 3, imageSize: 90, iconYOffset: 150, edge: 10, noise: 10 }, numDistorts: { min: 1, max: 10 }, distortion: 10 },
	
];

describe('generate gridv1 captcha', () => {
	for(let captchaOptions of cases) {	
		test(captchaOptions.name, async () => {
			const { captcha } = await gridv1(captchaOptions);
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

describe('generate gridv2 captcha', () => {
	for(let captchaOptions of cases) {	
		test(captchaOptions.name, async () => {
			const { captcha } = await gridv2(captchaOptions);
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
