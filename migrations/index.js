'use strict';

module.exports = {
	'0.0.1': require(__dirname+'/migration-0.0.1.js'), //add bypasses to database
	'0.0.2': require(__dirname+'/migration-0.0.2.js'), //rename ip field in posts
	'0.0.3': require(__dirname+'/migration-0.0.3.js'), //move files from /img to /file/
	'0.0.4': require(__dirname+'/migration-0.0.4.js'), //rename some fields for board lock mode and unlisting
	'0.0.5': require(__dirname+'/migration-0.0.5.js'), //add bumplimit to board settings
	'0.0.6': require(__dirname+'/migration-0.0.6.js'), //add blocked countries to board settings
	'0.0.7': require(__dirname+'/migration-0.0.7.js'), //sage only email without force anon for some reason
	'0.0.8': require(__dirname+'/migration-0.0.8.js'), //option to auto reset triggers after hour is over
	'0.0.9': require(__dirname+'/migration-0.0.9.js'), //ip changes
	'0.0.10': require(__dirname+'/migration-0.0.10.js'), //add links to modlog for new logs
	'0.0.11': require(__dirname+'/migration-0.0.11.js'), //rename captcha "text" field to "answer" since we support multiple captcha types now
	'0.0.12': require(__dirname+'/migration-0.0.12.js'), //yotsuba b -> yotsuba-b
	'0.0.13': require(__dirname+'/migration-0.0.13.js'), //add r9k mode (files)
	'0.0.14': require(__dirname+'/migration-0.0.14.js'), //add option for disable .onion file posts to board settings
	'0.0.15': require(__dirname+'/migration-0.0.15.js'), //messages r9k option
	'0.0.16': require(__dirname+'/migration-0.0.16.js'), //separate tph/pph triggers
	'0.0.17': require(__dirname+'/migration-0.0.17.js'), //add custompages collection
	'0.0.18': require(__dirname+'/migration-0.0.18.js'), //disable onion file posting to disable anonymizer file posting
	'0.0.19': require(__dirname+'/migration-0.0.19.js'), //fix incorrect index causing duplicate key error
}
