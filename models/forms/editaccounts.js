'use strict';

const { Accounts } = require(__dirname+'/../../db/');

module.exports = async (req, res, next) => {

	//edit the accounts
	let amount = 0;
	if (req.body.delete_account) {
		amount = await Accounts.deleteMany(req.body.checkedaccounts).then(res => res.deletedCount);
	} else {
		amount = await Accounts.setLevel(req.body.checkedaccounts, req.body.auth_level).then(res => res.modifiedCount);
	}

	return res.render('message', {
        'title': 'Success',
        'message': `${req.body.delete_account ? 'Deleted' : 'Edited'} ${amount} accounts`,
        'redirect': '/globalmanage/accounts.html'
    });

}
