const diceroll = require('./diceroll.js');

describe('diceroll markdown', () => {

	const prepareCases = [
		{ in: '##3%6', out: '##3%6=' },
		{ in: '##99%99', out: '##99%99=' },
		{ in: '##999%999', out: '##999%999' },
		{ in: '##3%8+5', out: '##3%8+5=' },
		{ in: '##3%8-5', out: '##3%8-5=' },
		{ in: '##0%0', out: '##0%0' },
	];
	for (let i in prepareCases) {
		test(`should contain ${prepareCases[i].out} for an input of ${prepareCases[i].in}`, () => {
			const output = prepareCases[i].in.replace(diceroll.regexPrepare, diceroll.prepare.bind(null, false));
			expect(output).toContain(prepareCases[i].out);
		});
	}

	const markdownCases = [
		{ in: '##3%6&#x3D;10', out: '(##3%6)' },
		{ in: '##99%99&#x3D;5138', out: '(##99%99)' },
		{ in: '##999%999&#x3D;10000', out: '##999%999&#x3D;' },
		{ in: '##0%0&#x3D;10', out: '##0%0&#x3D;' },
		{ in: '##0%0', out: '##0%0' },
	];
	for (let i in markdownCases) {
		test(`should contain ${markdownCases[i].out} for an input of ${markdownCases[i].in}`, () => {
			const output = markdownCases[i].in.replace(diceroll.regexMarkdown, diceroll.markdown.bind(null, false));
			expect(output).toContain(markdownCases[i].out);
		});
	}

});
