'use strict';

const { buildLogin } = require(__dirname+'/../../build.js')
	, uploadDirectory = require(__dirname+'/../../helpers/uploadDirectory.js');

module.exports = async (req, res, next) => {

    res.render('login', {
		'goto': req.query.goto
    });

}
