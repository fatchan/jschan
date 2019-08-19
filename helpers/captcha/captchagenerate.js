const gm = require('gm').subClass({ imageMagick: true })
	, rr = (min, max) => Math.floor(Math.random() * (max-min + 1) + min)
	, width = 200
	, height = 80
	, distortion = 15

module.exports = (text, captchaId) => {
	return new Promise((resolve, reject) => {
		const recy = rr(35,45);
		const distorts = [];
		const numDistorts = rr(3,5);
		const div = width/numDistorts;
		for (let i = 0; i < numDistorts; i++) {
			const originx = rr((div*i)+distortion, (div*(i+1))-distortion);
			const originy = rr(distortion,height-distortion);
			const destx = rr(Math.max(distortion,originx-distortion),Math.min(width-distortion,originx+distortion));
			const desty = rr(Math.max(distortion,originy-distortion*2),Math.min(height-distortion,originy+distortion*2));
			distorts.push([
				{x:originx,y:originy}, //origin
				{x:destx,y:desty} //dest
			]);
		}
		const x = gm(width,height, '#282a2e')
		.fill('#c5c8c6')
		.fontSize(65)
		let lastx = 7;
		for (let i = 0; i <6; i++) {
			x.drawText(lastx, 60, text[i])
			switch (text[i]) {
				case 'w':
				case 'm':
						lastx += 45;
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
		//.drawText(5, 60, text)
		x.drawRectangle(5, recy, 195, recy+4)
		.distort(distorts, 'Shepards')
		//.quality(30)
		.write(`./static/captcha/${captchaId}.jpg`, (err) => {
			if (err) {
				return reject(err);
			}
			return resolve();
		});
	})
}
