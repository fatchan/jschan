module.exports = {

	//mongodb connection string
	dbURL: `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@mongodb:27017`,

	//database name
	dbName: 'jschan',

	//redis connection info
	redis: {
		host: 'redis',
		port: '6379',
		password: process.env.REDIS_PASSWORD,
	},

	//backend webserver port
	port: 7000,

	//secrets/salts for various things
	cookieSecret: process.env.COOKIE_SECRET,
	tripcodeSecret: process.env.TRIPCODE_SECRET,
	ipHashSecret: process.env.IP_HASH_SECRET,
	postPasswordSecret: process.env.POST_PASSWORD_SECRET,

	//keys for google recaptcha
	google: {
		siteKey: process.env.GOOGLE_SITEKEY,
		secretKey: process.env.GOOGLE_SECRETKEY,
	},

	//keys for hcaptcha
	hcaptcha: {
		siteKey: process.env.HCAPTCHA_SITEKEY,
		secretKey: process.env.HCAPTCHA_SECRETKEY,
	},

	//keys for yandex smartcaptcha
	yandex: {
		siteKey: process.env.YANDEX_CAPTCHA_SITEKEY,
		secretKey: process.env.YANDEX_CAPTCHA_SECRETKEY,
	},

	//enable debug logging
	debugLogs: true,

};
