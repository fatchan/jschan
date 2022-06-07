'use strict';

module.exports = async(db, redis) => {
	console.log('add more captcha options');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'captchaOptions.text': {
				'line': false,
				'wave': false,
				'paint': false,
			},
			'captchaOptions.grid.falses': ['○','□','♘','♢','▽','△','♖','✧','♔','♘','♕','♗','♙','♧'],
			'captchaOptions.grid.trues': ['●','■','♞','♦','▼','▲','♜','✦','♚','♞','♛','♝','♟','♣'],
			'captchaOptions.grid.question': 'Select the solid/filled icons',		
		},
	});
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
};
