'use strict';

const Permission = require(__dirname+'/../../../lib/permission/permission.js')
	, { Permissions } = require(__dirname+'/../../../lib/permission/permissions.js');

module.exports = async (req, res, next) => {

	let staffData = res.locals.board.staff[req.params.staffusername];

	if (staffData == null) {
		//staff does not exist
		return next();
	}

	res
//	.set('Cache-Control', 'private, max-age=5')
		.render('editstaff', {
			csrf: req.csrfToken(),
			board: res.locals.board,
			permissions: res.locals.permissions,
			staffUsername: req.params.staffusername,
			staffPermissions: new Permission(staffData.permissions),
			manageBoardBits: Permissions._MANAGE_BOARD_BITS,
		});

};
