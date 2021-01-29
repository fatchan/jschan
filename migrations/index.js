'use strict';

const fs = require('fs')
	, semver = require('semver');

fs.readdirSync(__dirname).forEach(file => {
	const name = file.substring(0, file.length-3);
	if (!semver.valid(name)) { return; }
	module.exports[name] = require(__dirname+'/'+file);
});
