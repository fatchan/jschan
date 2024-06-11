const escapeRegExp = require('./escaperegexp.js');

describe('escape regular expression', () => {

	const cases = [
		{ in: '', out: '' },
		{ in: '/', out: '/' },
		{ in: '.*+?^${}()|[]\\', out: '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\' },
	];

	for (let i in cases) {
		test(`should output ${cases[i].out} for an input of ${cases[i].in}`, () => {
			expect(escapeRegExp(cases[i].in)).toStrictEqual(cases[i].out);
		});
	}

});
