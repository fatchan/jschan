'use strict';

const fs = require('fs-extra')
	, Schedule = require(__dirname+'/../Schedule.js');

fs.readdirSync(__dirname).forEach(file => {
	if (file === 'index.js') { return; }
	const name = file.substring(0, file.length-3);
	const { func, interval, immediate, condition } = require(__dirname+'/'+file);
	module.exports[name] = new Schedule(func, interval, immediate, condition);
});
