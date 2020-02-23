'use strict';

module.exports = {
	'0.0.1': require(__dirname+'/migration-0.0.1.js'), //add bypasses to database
	'0.0.2': require(__dirname+'/migration-0.0.2.js'), //rename ip field in posts
}
