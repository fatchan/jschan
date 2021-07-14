'use strict';

module.exports = {

	deleteBoardController: require(__dirname+'/deleteboard.js'),
	editBansController: require(__dirname+'/editbans.js'),
	appealController: require(__dirname+'/appeal.js'),
	globalActionController: require(__dirname+'/globalactions.js'),
	actionController: require(__dirname+'/actions.js'),
	addCustomPageController: require(__dirname+'/addcustompage.js'),
	deleteCustomPageController: require(__dirname+'/deletecustompage.js'),
	addNewsController: require(__dirname+'/addnews.js'),
	editNewsController: require(__dirname+'/editnews.js'),
	editCustomPageController: require(__dirname+'/editcustompage.js'),
	deleteNewsController: require(__dirname+'/deletenews.js'),
	uploadBannersController: require(__dirname+'/uploadbanners.js'),
	deleteBannersController: require(__dirname+'/deletebanners.js'),
	addAssetsController: require(__dirname+'/addassets.js'),
	deleteAssetsController: require(__dirname+'/deleteassets.js'),
	addFlagsController: require(__dirname+'/addflags.js'),
	deleteFlagsController: require(__dirname+'/deleteflags.js'),
	boardSettingsController: require(__dirname+'/boardsettings.js'),
	transferController: require(__dirname+'/transfer.js'),
	resignController: require(__dirname+'/resign.js'),
	deleteAccountController: require(__dirname+'/deleteaccount.js'),
	loginController: require(__dirname+'/login.js'),
	registerController: require(__dirname+'/register.js'),
	changePasswordController: require(__dirname+'/changepassword.js'),
	editAccountsController: require(__dirname+'/editaccounts.js'),
	globalSettingsController: require(__dirname+'/globalsettings.js'),
	createBoardController: require(__dirname+'/create.js'),
	makePostController: require(__dirname+'/makepost.js'),
	editPostController: require(__dirname+'/editpost.js'),

	//these dont have a "real" controller
	newCaptcha: require(__dirname+'/../../models/forms/newcaptcha.js'),
	blockBypass: require(__dirname+'/../../models/forms/blockbypass.js'),
	logout: require(__dirname+'/../../models/forms/logout.js'),

};
