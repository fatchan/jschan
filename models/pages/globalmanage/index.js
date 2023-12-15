'use strict';

module.exports = {
	globalManageReports: require(__dirname+'/reports.js'),
	globalManageBans: require(__dirname+'/bans.js'),
	globalManageLogs: require(__dirname+'/logs.js'),
	globalManageBoards: require(__dirname+'/boards.js'),
	globalManageRecent: require(__dirname+'/recent.js'),
	globalManageNews: require(__dirname+'/news.js'),
	globalManageFilters: require(__dirname+'/filters.js'),
	globalManageAccounts: require(__dirname+'/accounts.js'),
	globalManageSettings: require(__dirname+'/settings.js'),
	globalManageRoles: require(__dirname+'/roles.js'),
	globalEditFilter: require(__dirname+'/editfilter.js'),
	editNews: require(__dirname+'/editnews.js'),
	editAccount: require(__dirname+'/editaccount.js'),
	editRole: require(__dirname+'/editrole.js'),
};
