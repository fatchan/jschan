'use strict';

const { buildLogin } = require(__dirname+'/../../helpers/build.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js');

module.exports = async (req, res, next) => {

    res.render('login', {
		'goto': req.query.goto
    });

}
