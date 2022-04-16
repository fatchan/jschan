const diceroll = require('./diceroll.js');

describe('diceroll markdown', () => {

	const prepareCases = [
		{ in: '##3d6', out: '##3d6=' },
		{ in: '##99d99', out: '##99d99=' },
		{ in: '##999d999', out: '##999d999' },
		{ in: '##3d8+5', out: '##3d8+5=' },
		{ in: '##3d8-5', out: '##3d8-5=' },
		{ in: '##0d0', out: '##0d0' },
	];
	for(let i in prepareCases) {
		test(`should contain ${prepareCases[i].out} for an input of ${prepareCases[i].in}`, () => {
			const output = prepareCases[i].in.replace(diceroll.regexPrepare, diceroll.prepare.bind(null, false));
			expect(output).toContain(prepareCases[i].out);
		});
	}

	const markdownCases = [
		{ in: '##3d6&#x3D;10', out: 'Rolled 3 dice with 6 sides =' },
		{ in: '##99d99&#x3D;5138', out: 'Rolled 99 dice with 99 sides =' },
		{ in: '##999d999&#x3D;10000', out: '##999d999&#x3D;10000' },
		{ in: '##0d0', out: '##0d0' },
	];
	for(let i in markdownCases) {
		test(`should contain ${markdownCases[i].out} for an input of ${markdownCases[i].in}`, () => {
			const output = markdownCases[i].in.replace(diceroll.regexMarkdown, diceroll.markdown.bind(null, false));
			expect(output).toContain(markdownCases[i].out);
		});
	}

});
