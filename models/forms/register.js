'use strict';

const { Accounts } = require(__dirname+'/../../db/');

module.exports = async (req, res, next) => {

	const original = req.body.username; //stored but not used yet
	const username = original.toLowerCase(); //lowercase to prevent duplicates with mixed case
	const password = req.body.password;

	const account = await Accounts.findOne(username);

	// if the account exists reject
	if (account != null) {
		return res.status(409).render('message', {
			'title': 'Conflict',
			'message': 'Account with this username already exists',
			'redirect': '/register.html'
		});
	}

	// add account to db. password is hashed in db model func for easier tests
	await Accounts.insertOne(original, username, password, 4);

	return res.redirect('/login.html');

}
