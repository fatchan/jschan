const { trimSetting, numberSetting, booleanSetting, arraySetting } = require('./setting.js');

describe('trimSetting, numberSetting, booleanSetting, arraySetting', () => {

	const trimCases = [
		{ in: '', out: '' },
		{ in: '   lol   ', out: 'lol' },
		{ in: 1, out: 'OLDSETTING' },
		{ in: null, out: 'OLDSETTING' },
	];
	for (let i in trimCases) {
		test(`trimSetting should output ${trimCases[i].out} for an input of ${trimCases[i].in}`, () => {
			expect(trimSetting(trimCases[i].in, 'OLDSETTING')).toStrictEqual(trimCases[i].out);
		});
	}

	const numberCases = [
		{ in: 3, out: 3 },
		{ in: undefined, out: 'OLDSETTING' },
		{ in: null, out: 'OLDSETTING' },
		{ in: [], out: 'OLDSETTING' },
		{ in: '', out: 'OLDSETTING' },
		{ in: 'string', out: 'OLDSETTING' },
	];
	for (let i in numberCases) {
		test(`numberSetting should output ${numberCases[i].out} for an input of ${numberCases[i].in}`, () => {
			expect(numberSetting(numberCases[i].in, 'OLDSETTING')).toStrictEqual(numberCases[i].out);
		});
	}

	const booleanCases = [
		{ in: null, out: false },
		{ in: undefined, out: false },
		{ in: '', out: true },
		{ in: 'test', out: true },
		{ in: 1, out: true },
		{ in: [], out: true },
		{ in: [1], out: true },
	];
	for (let i in booleanCases) {
		test(`booleanSetting should output ${booleanCases[i].out} for an input of ${booleanCases[i].in}`, () => {
			expect(booleanSetting(booleanCases[i].in)).toStrictEqual(booleanCases[i].out);
		});
	}

	const arrayCases = [
		{ in: undefined, out: 'OLDSETTING' },
		{ in: null, out: 'OLDSETTING' },
		{ in: '', out: [] },
		{ in: 'test', out: ['test'] },
		{ in: 1, out: 'OLDSETTING' },
		{ in: [], out: 'OLDSETTING' },
		{ in: '1', out: ['1'] },
		{ in: `1
2
3`, out: ['1', '2', '3'] },
		{ in: `  hello  

123

xxx`, out: ['  hello  ', '123', 'xxx'] },
	];
	for (let i in arrayCases) {
		test(`arraySetting should output ${arrayCases[i].out} for an input of ${arrayCases[i].in}`, () => {
			expect(arraySetting(arrayCases[i].in, 'OLDSETTING', 10)).toStrictEqual(arrayCases[i].out);
		});
	}

});
