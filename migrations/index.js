'use strict';

module.exports = {
	'0.0.1': require(__dirname+'/migration-0.0.1.js'), //add bypasses to database
	'0.0.2': require(__dirname+'/migration-0.0.2.js'), //rename ip field in posts
	'0.0.3': require(__dirname+'/migration-0.0.3.js'), //move files from /img to /file/
	'0.0.4': require(__dirname+'/migration-0.0.4.js'), //rename some fields for board lock mode and unlisting
}
