const paramConverter = require('./paramconverter.js');
const { WEEK, DAY, HOUR } = require('./timeutils.js');
/*
const defaultOptions = {
	timeFields: [],
	trimFields: [],
	allowedArrays: [],
	numberFields: [],
	numberArrays: [],
	objectIdParams: [],
	objectIdFields: [],
	objectIdArrays: [],
	processThreadIdParam: false,
	processDateParam: false,
	processMessageLength: false,
};
*/

describe('paramconverter', () => {

	const cases = [
		{
			in: { options: { trimFields: ['username', 'password'] }, body: { username: 'trimmed  ', password: 'trimmed    ' } },
			out: { username: 'trimmed', password: 'trimmed' }
		},
		{
			in: { options: { timeFields: ['test'] }, body: { test: '1w2d3h' } },
			out: { test: WEEK+(2*DAY)+(3*HOUR) }
		},
		//todo: add a bunch more
	];

	for(let i in cases) {
		test(`should output ${cases[i].out} for an input of ${cases[i].in}`, () => {
			const converter = paramConverter(cases[i].in.options);
			converter({ body: cases[i].in.body }, {}, () => {});
			expect(cases[i].in.body).toStrictEqual(cases[i].out);
		});
	}

});
