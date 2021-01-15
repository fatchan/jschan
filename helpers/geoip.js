'use strict'

const { countryNamesMap } = require(__dirname+'/countries.js')
	, { countryCodeHeader } = require(__dirname+'/../configs/main.js');

module.exports = (req, res, next) => {
	const code = req.headers[countryCodeHeader] || 'XX';
	res.locals.tor = code === 'TOR' || code === 'LOKI'; //NOTE: for ticket #312 change this to use a single x-anonymizer header
	res.locals.country = {
		code,
		name: countryNamesMap[code],
	}
	return next();
}
