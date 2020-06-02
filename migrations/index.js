'use strict';

module.exports = {
	'0.0.1': require(__dirname+'/migration-0.0.1.js'), //add bypasses to database
	'0.0.2': require(__dirname+'/migration-0.0.2.js'), //rename ip field in posts
	'0.0.3': require(__dirname+'/migration-0.0.3.js'), //move files from /img to /file/
	'0.0.4': require(__dirname+'/migration-0.0.4.js'), //rename some fields for board lock mode and unlisting
	'0.0.5': require(__dirname+'/migration-0.0.5.js'), //add bumplimit to board settings
	'0.0.6': require(__dirname+'/migration-0.0.6.js'), //add blocked countries to board settings
	'0.0.7': require(__dirname+'/migration-0.0.7.js'), //sage only email without force anon for some reason
	'0.0.8': require(__dirname+'/migration-0.0.8.js'), //ip changes
}
