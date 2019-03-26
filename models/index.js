'use strict';

const fs = require('fs')
	, models = {};

fs.readdirSync(__dirname).forEach(file => {
	if (file === 'index.js') {
		return;
	}
	const name = file.substring(0,file.length-3);
	const model = require(__dirname+'/'+file);
	module.exports[name] = model;
});
