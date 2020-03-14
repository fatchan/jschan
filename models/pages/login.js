'use strict';

const { buildLogin } = require(__dirname+'/../../helpers/tasks.js')
	, uploadDirectory = require(__dirname+'/../../helpers/files/uploadDirectory.js');

module.exports = async (req, res, next) => {

    res.render('login', {
		'goto': (typeof req.query.goto === 'string' ? req.query.goto : null)
    });

}
