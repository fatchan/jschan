'use strict';

const { buildCreate } = require(__dirname+'/../../helpers/build.js');

module.exports = async (req, res, next) => {

    res.render('create', {
		csrf: req.csrfToken(),
	});

}
