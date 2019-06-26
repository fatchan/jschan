const gm = require('@tohru/gm')
	, rr = (min, max) => Math.floor(Math.random() * (max-min + 1) + min)
	, width = 200
	, height = 80;

function getShape() {
	const x1 = rr(width * 0.1, width * 0.9)
		, y1 = rr(height * 0.1, height * 0.9)
		, size = rr(15, 30)
		, x2 = rr(x1, x1 + size)
		, y2 = rr(y1, y1 + size);
	return { x1, x2, y1, y2 };
}

module.exports = (text, captchaId) => {
	return new Promise((resolve, reject) => {
		text = text.split(''); //array of chars
		const x = gm(200, 80, '#fff')
		.fill('#000')
		.fontSize(70)
		let lastx = 0;
		for (let i = 0; i <6; i++) {
			x.drawText(lastx, 50+rr(0,10), text[i])
			switch (text[i]) {
				case 'w':
				case 'm':
					lastx += 40;
					break;
				case 'i':
				case 'f':
				case 'l':
				case 'j':
				case 't':
					lastx += 15;
					break;
				default:
					lastx += 30;
					break;
			}
		}
		const recy1 = rr(30,50)
		x.drawRectangle(rr(5,10), recy1, rr(190,195), recy1+5)
		.wave(10, rr(80,120))
		.blur(1, 2)
		.crop(200, 80, 0, 0)
		.quality(30)
		.write(`./static/captcha/${captchaId}.jpg`, (err) => {
			if (err) {
				return reject(err);
			}
			return resolve();
		});
	})
}
