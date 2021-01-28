'use strict'

const { countryNamesMap, isAnonymizer } = require(__dirname+'/countries.js')
	, { countryCodeHeader } = require(__dirname+'/../configs/main.js')

module.exports = (req, res, next) => {
	const code = req.headers[countryCodeHeader] || 'XX';
	res.locals.anonymizer = isAnonymizer(code);
	res.locals.country = {
		code,
		name: countryNamesMap[code],
	}
	return next();
}
