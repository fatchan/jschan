const locales = ['en-GB', 'pt-PT', 'pt-BR', 'ru-RU', 'it-IT'];

locales.forEach(locale => {
    const sortedEntries = Object.entries(require(__dirname+`/../locales/${locale}.json`))
        .sort((a, b) => a[0].localeCompare(b[0]))
        .reduce((acc, e) => {
            acc[e[0]] = e[1];
            return acc;
        }, {});
    require('fs').writeFileSync(__dirname+`/../locales/${locale}.json`, JSON.stringify(sortedEntries, null, '\t'));
});
