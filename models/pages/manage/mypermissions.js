'use strict';

const { Permissions } = require(__dirname+'/../../../lib/permission/permissions.js');

module.exports = async (req, res) => {

	res
		.set('Cache-Control', 'private, max-age=5')
		.render('managemypermissions', {
			user: res.locals.user,
			board: res.locals.board,
			permissions: res.locals.permissions,
			manageBoardBits: Permissions._MANAGE_BOARD_BITS,
		});

};
