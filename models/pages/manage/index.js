'use strict';

module.exports = {
	manageReports: require(__dirname+'/reports.js'),
	manageRecent: require(__dirname+'/recent.js'),
	manageSettings: require(__dirname+'/settings.js'),
	manageBans: require(__dirname+'/bans.js'),
	manageBanners: require(__dirname+'/banners.js'),
	manageBoard: require(__dirname+'/board.js'),
	manageThread: require(__dirname+'/thread.js'),
}
