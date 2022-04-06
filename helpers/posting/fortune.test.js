const fortune = require('./fortune.js');

describe('fortune markdown', () => {
	const cases = [
		{ in: '##fortune', out: "<span class='title'>" },
	];
	for(let i in cases) {
		test(`should contain ${cases[i].out} for an input of ${cases[i].in}`, () => {
			expect(cases[i].in.replace(fortune.regex, fortune.markdown.bind(null, false))).toContain(cases[i].out)
		});
	}
});
