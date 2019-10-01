'use strict';

const deleteOld = require(__dirname+'/../helpers/files/deleteold.js')
	, msTime = require(__dirname+'/../helpers/mstime.js')

module.exports = () => {
	return deleteOld('captcha', Date.now()-(msTime.minute*5));
}
