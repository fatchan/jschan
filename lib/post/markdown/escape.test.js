const simpleEscape = require('./escape.js');

describe('simpleEscape() - convert some characters to html entities', () => {
	const cases = [
		{ in: '\'', out: '&#39;' },
		{ in: '/', out: '&#x2F;' },
		{ in: '`', out: '&#x60;' },
		{ in: '=', out: '&#x3D;' },
		{ in: '&', out: '&amp;' },
		{ in: '<', out: '&lt;' },
		{ in: '>', out: '&gt;' },
		{ in: '"', out: '&quot;' },
	];
	for(let i in cases) {
		test(`should output ${cases[i].out} for an input of ${cases[i].in}`, () => {
			expect(simpleEscape(cases[i].in)).toBe(cases[i].out);
		});
	}
});
