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
		.fontSize(80)
		for (let i = 0; i <6; i++) {
			x.drawText(i*30, 55+rr(0,10), text[i])
		}
		for (let i = 0; i <4; i++) {
			const shape = getShape();
			x.strokeWidth(rr(3, 5))
			x.drawCircle(shape.x1, shape.y1, shape.x2, shape.y1)
		}
		x.wave(10, rr(50,80))
		.blur(1, 2)
		.crop(200, 80, 0, 0)
		.write(`./uploads/captcha/${captchaId}.png`, (err) => {
			if (err) {
				return reject();
			}
			return resolve();
		});
	})
}
