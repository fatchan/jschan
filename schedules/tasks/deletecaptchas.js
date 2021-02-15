'use strict';

const deleteOld = require(__dirname+'/../../helpers/files/deleteold.js')
	, timeUtils = require(__dirname+'/../../helpers/timeutils.js');

module.exports = {

	func: async () => {
		return deleteOld('captcha', Date.now()-(timeUtils.MINUTE*5))
	},
	interval: timeUtils.MINUTE*5,
	immediate: true,
	condition: null

};
