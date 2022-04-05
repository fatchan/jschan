module.exports = {

	//mongodb connection string
	dbURL: 'mongodb://mongodb:27017',

	//database name
	dbName: 'jschan',

	//redis connection info
	redis: {
		host: 'redis',
		port: '6379',
		password: ''
	},

	//backend webserver port
	port: 7000,

	//secrets/salts for various things
	cookieSecret: 'changeme',
	tripcodeSecret: 'changeme',
	ipHashSecret: 'changeme',
	postPasswordSecret: 'changeme',

	//keys for google recaptcha
	google: {
		siteKey: 'changeme',
		secretKey: 'changeme'
	},

	//keys for hcaptcha
	hcaptcha: {
		siteKey: '10000000-ffff-ffff-ffff-000000000001',
		secretKey: '0x0000000000000000000000000000000000000000'
	},

	//enable debug logging
	debugLogs: true,

};
