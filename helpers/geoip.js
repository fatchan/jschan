'use strict'

const { countryNamesMap } = require(__dirname+'/countries.js')
	, { countryCodeHeader, isAnonymizer } = require(__dirname+'/../configs/main.js')

module.exports = (req, res, next) => {
	const code = req.headers[countryCodeHeader] || 'XX';
	res.locals.anonymizer = isAnonymizer(code);
	res.locals.country = {
		code,
		name: countryNamesMap[code],
	}
	return next();
}
