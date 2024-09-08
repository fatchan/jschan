'use strict';

const { Posts, Boards } = require(__dirname+'/../../db/')
	, config = require(__dirname+'/../../lib/misc/config.js')
	, { Permissions } = require(__dirname+'/../../lib/permission/permissions.js')
	, Permission = require(__dirname+'/../../lib/permission/permission.js')
	, roleManager = require(__dirname+'/../../lib/permission/rolemanager.js');

module.exports = async (req, res, next) => {

	const { forceActionTwofactor } = config.get;
	let boardReportCountMap = {}; //map of board to open report count
	let globalReportCount = 0; //number of open global reports
	let boardPermissions; //map of board perms
	let userBoards = [];

	let boardReportCounts;
	try {
		userBoards = res.locals.user.ownedBoards.concat(res.locals.user.staffBoards);
		([boardReportCounts, boardPermissions, globalReportCount] = await Promise.all([
			userBoards.length > 0 ? Posts.getBoardReportCounts(userBoards) : [],
			res.locals.user.staffBoards.length > 0 ? Boards.getStaffPerms(res.locals.user.staffBoards, res.locals.user.username) : null,
			res.locals.permissions.get(Permissions.MANAGE_GLOBAL_GENERAL) ? Posts.getGlobalReportsCount() : 0,
		]));
	} catch (err) {
		return next(err);
	}

	if (boardReportCounts && boardReportCounts.length > 0) {
		//make the aggregate array from mongodb to a map
		boardReportCountMap = boardReportCounts.reduce((acc, val) => {
			acc[val._id] = val.count;
			return acc;
		}, boardReportCountMap);
	}

	if (boardPermissions) {
		//calcperms isnt multi-board (but neither is this, really) its alright until then
		boardPermissions = boardPermissions.reduce((acc, bs) => {
			acc[bs._id] = new Permission(bs.staff[res.locals.user.username].permissions.toString('base64'));
			const boardRolePermission = bs.owner === res.locals.user.username
				? roleManager.roles.BOARD_OWNER
				: roleManager.roles.BOARD_STAFF;
			for (let bit of Permissions._MANAGE_BOARD_BITS) {
				const inheritOrGlobal = res.locals.permissions.get(bit)
					|| (acc[bs._id].get(bit)
						&& boardRolePermission.get(bit));
				acc[bs._id].set(bit, inheritOrGlobal);
			}
			return acc;
		}, {});
	}

	res
		.set('Cache-Control', 'private, max-age=5')
		.render('account', {
			csrf: req.csrfToken(),
			user: res.locals.user,
			permissions: res.locals.permissions,
			boardPermissions,
			boardReportCountMap,
			globalReportCount,
			forceActionTwofactor,
		});

};
