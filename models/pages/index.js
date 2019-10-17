'use strict';

module.exports = {
	changePassword: require(__dirname+'/changepassword.js'),
	register: require(__dirname+'/register.js'),
	home: require(__dirname+'/home.js'),
	login: require(__dirname+'/login.js'),
	logout: require(__dirname+'/logout.js'),
	create: require(__dirname+'/create.js'),
	board: require(__dirname+'/board.js'),
	catalog: require(__dirname+'/catalog.js'),
	banners: require(__dirname+'/banners.js'),
	randombanner: require(__dirname+'/randombanner.js'),
	news: require(__dirname+'/news.js'),
	captchaPage: require(__dirname+'/captchapage.js'),
	captcha: require(__dirname+'/captcha.js'),
	thread: require(__dirname+'/thread.js'),
	modlog: require(__dirname+'/modlog.js'),
	modloglist: require(__dirname+'/modloglist.js'),
	boardlist: require(__dirname+'/boardlist.js'),
}
