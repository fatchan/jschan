'use strict';

module.exports = async(db, redis) => {
	console.log('add more captcha options');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'captchaOptions.text': {
				'font': 'default',
				'line': false,
				'wave': 0,
				'paint': 2,
				'noise': 0,
			},
			'captchaOptions.grid.falses': ['○','□','♘','♢','▽','△','♖','✧','♔','♘','♕','♗','♙','♧'],
			'captchaOptions.grid.trues': ['●','■','♞','♦','▼','▲','♜','✦','♚','♞','♛','♝','♟','♣'],
			'captchaOptions.grid.question': 'Select the solid/filled icons',
			'captchaOptions.grid.noise': 0,
			'captchaOptions.grid.edge': 25,
		},
	});
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
};
