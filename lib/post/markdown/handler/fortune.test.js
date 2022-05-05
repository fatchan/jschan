const fortune = require('./fortune.js');

describe('fortune markdown', () => {
	test('should contain a random fortune for an input of ##fortune', () => {
		const output = '##fortune'.replace(fortune.regex, fortune.markdown.bind(null, false));
		const hasFortuneText = fortune.fortunes.some(f => output.includes(f));
		expect(hasFortuneText).toBe(true);
	});
});
