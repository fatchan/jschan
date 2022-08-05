'use strict';

const timeUtils = require(__dirname+'/../lib/converter/timeutils.js');

module.exports = async(db, redis) => {
	console.log('add more captcha options and add inactive account and board auto handling');
	await db.collection('globalsettings').updateOne({ _id: 'globalsettings' }, {
		'$set': {
			'captchaOptions.text': {
				'font': 'default',
				'line': true,
				'wave': 0,
				'paint': 2,
				'noise': 0,
			},
			'captchaOptions.grid.falses': ['○','□','♘','♢','▽','△','♖','✧','♔','♘','♕','♗','♙','♧'],
			'captchaOptions.grid.trues': ['●','■','♞','♦','▼','▲','♜','✦','♚','♞','♛','♝','♟','♣'],
			'captchaOptions.grid.question': 'Select the solid/filled icons',
			'captchaOptions.grid.noise': 0,
			'captchaOptions.grid.edge': 25,
			'inactiveAccountTime': timeUtils.MONTH * 3,
			'inactiveAccountAction': 0, //no actions by default
			'abandonedBoardAction': 0,
			'hotThreadsMaxAge': timeUtils.MONTH,
		},
	});
	console.log('Clearing globalsettings cache');
	await redis.deletePattern('globalsettings');
};
