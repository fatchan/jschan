'use strict';

const { Accounts } = require(__dirname+'/../../db/')

module.exports = async (username) => {

	//this definitely needs to be its own file (v:
	await Accounts.deleteOne(username);

}
