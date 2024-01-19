const pageQueryConverter = require('./pagequeryconverter.js');
const limit = 30;

describe('page query converter', () => {
	const cases = [
		{ in: null, out: { offset: 0, 'queryString': '', page: 1 } },
		{ in: { }, out: { offset: 0, 'queryString': '', page: 1 } },
		{ in: { page: [1, 2, 3] }, out: { offset: 0, 'queryString': '', page: 1 } },
		{ in: { page: 'test' }, out: { offset: 0, 'queryString': '', page: 1 } },
		{ in: { page: null }, out: { offset: 0, 'queryString': '', page: 1 } },
		{ in: { page: -1 }, out: { offset: 0, 'queryString': '', page: 1 } },
		{ in: { page: 0 }, out: { offset: 0, 'queryString': '', page: 1 } },
		{ in: { page: 1 }, out: { offset: 0, 'queryString': '', page: 1 } },
		{ in: { page: 5 }, out: { offset: limit*4, 'queryString': '', page: 5 } },
		{ in: { page: 10, other: 'test' }, out: { offset: limit*9, 'queryString': 'other=test', page: 10 } },
		{ in: { other: 'test' }, out: { offset: 0, 'queryString': 'other=test', page: 1 } },
	];
	for (let i in cases) {
		test(`should contain ${cases[i].out} for an input of ${cases[i].in}`, () => {
			expect(pageQueryConverter(cases[i].in, limit)).toStrictEqual(cases[i].out);
		});
	}
});
