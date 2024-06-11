const fs = require('fs')
	, locales = ['en-GB', 'pt-PT', 'pt-BR', 'ru-RU', 'it-IT']
	, enGBData = require(__dirname+'/../locales/en-GB.json');

locales.forEach(locale => {
	const localeData = require(__dirname+`/../locales/${locale}.json`);
	// Take any missing values from en-GB
	for (const key in enGBData) {
		if (!localeData[key]) {
			localeData[key] = enGBData[key];
		}
	}
	// Sort and write updated data
	const sortedEntries = Object.entries(localeData)
		.sort((a, b) => a[0].localeCompare(b[0]))
		.reduce((acc, [key, value]) => {
			acc[key] = value;
			return acc;
		}, {});
	fs.writeFileSync(__dirname+`/../locales/${locale}.json`, JSON.stringify(sortedEntries, null, '\t'));
});
