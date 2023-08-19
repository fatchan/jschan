const paramConverter = require('./paramconverter.js');
const { ObjectId } = require('mongodb');
const { WEEK, DAY, HOUR } = require('./../../converter/timeutils.js');
const noop = () => {};
/*
const defaultOptions = {
	timeFields: [],
	trimFields: [],
	allowedArrays: [],
	numberFields: [],
	numberArrays: [],
	objectIdFields: [],
	objectIdArrays: [],
	processDateParam: false,
	processMessageLength: false,
};
*/

describe('paramconverter', () => {

	const bodyCases = [
		{
			in: { options: { trimFields: ['username', 'password'] }, body: { username: 'trimmed  ', password: 'trimmed    ' } },
			out: { username: 'trimmed', password: 'trimmed' },
		},
		{
			in: { options: { allowedArrays: ['array'] }, body: { array: 'lol' } },
			out: { array: ['lol'] },
		},
		{
			in: { options: { allowedArrays: ['array'] }, body: { array: ['lol'] } },
			out: { array: ['lol'] },
		},
		{
			in: { options: { allowedArrays: ['array'] }, body: { notarray: ['lol'] } },
			out: 'error',
		},
		{
			in: { options: { numberFields: ['num'] }, body: { num: '1' } },
			out: { num: 1 },
		},
		{
			in: { options: { numberFields: ['num'] }, body: { num: 'xxxx' } },
			out: { num: null },
		},
		{
			in: { options: { allowedArrays: ['num'], numberArrays: ['num'] }, body: { num: '1' } },
			out: { num: [1] },
		},
		{
			in: { options: { allowedArrays: ['num'], numberArrays: ['num'] }, body: { num: ['1', '2', '3'] } },
			out: { num: [1, 2, 3] },
		},
		{
			in: { options: { allowedArrays: ['num'], numberArrays: ['num'] }, body: { notnum: ['1', '2', '3'] } },
			out: 'error',
		},
		{
			in: { options: { allowedArrays: ['num'], numberArrays: ['num'] }, body: { num: ['xxx', '2', '3'] } },
			out: { num: [2, 3] },
		},
		{
			in: { options: { allowedArrays: ['num'], numberArrays: ['num'] }, body: { num: [] } },
			out: { num: [] },
		},
		{
			in: { options: { allowedArrays: ['num'], numberArrays: ['num'] }, body: { num: '' } },
			out: { num: [] },
		},
		{
			in: { options: { allowedArrays: ['num'], numberArrays: ['num'] }, body: { num: null } },
			out: { num: [] },
		},
		{
			in: { options: { timeFields: ['test'] }, body: { test: '1w2d3h' } },
			out: { test: WEEK+(2*DAY)+(3*HOUR) },
		},
		{
			in: { options: { timeFields: ['test'] }, body: { test: '20000' } },
			out: { test: 20000 },
		},
		{
			in: { options: { timeFields: ['test'] }, body: { test: 'xxxx' } },
			out: { test: null },
		},
		{
			in: { options: { objectIdFields: ['test'] }, body: { test: 'aaaaaaaaaaaaaaaaaaaaaaaa' } },
			out: { test: ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa') },
		},
		{
			in: { options: { objectIdFields: ['test'] }, body: { test: 'x' } },
			out: 'error',
		},
		{
			in: { options: { objectIdFields: ['test'] }, body: { test: '0' } },
			out: 'error',
		},
		{
			in: { options: { objectIdFields: ['test'] }, body: { test: null } },
			out: { test: null },
		},
		{
			in: { options: { objectIdFields: ['test'] }, body: { test: '' } },
			out: 'error',
		},
		{
			in: { options: { objectIdFields: ['test'] }, body: { nottest: 'x' } },
			out: { nottest: 'x' },
		},
		{
			in: { options: { allowedArrays: ['test'], objectIdArrays: ['test'] }, body: { test: 'aaaaaaaaaaaaaaaaaaaaaaaa' } },
			out: { test: [ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa')] },
		},
		{
			in: { options: { allowedArrays: ['test'], objectIdArrays: ['test'] }, body: { test: ['aaaaaaaaaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaaaaaaaaa'] } },
			out: { test: [ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa'), ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa')] },
		},
		{
			in: { options: { objectIdArrays: ['test'] }, body: { test: 'x' } },
			out: 'error',
		},
		{
			in: { options: { processMessageLength: true }, body: { message: 'asd' } },
			out: { message: 'asd', rawMessage: 'asd' },
		},
		{
			in: { options: { processMessageLength: true }, body: { message: 'asd\r\nasd\nasd' } },
			out: { message: 'asd\r\nasd\nasd', rawMessage: 'asd\r\nasd\nasd' },
		},
	];

	for(let i in bodyCases) {
		test(`${i} should output ${bodyCases[i].out} for an input of ${bodyCases[i].in}`, () => {
			const converter = paramConverter(bodyCases[i].in.options);
			if (bodyCases[i].out === 'error') {
				expect(() => {
					converter({ body: bodyCases[i].in.body }, {locals:{}}, noop);
				}).toThrow();
			} else {
				converter({ body: bodyCases[i].in.body }, {locals:{}}, noop);
				expect(bodyCases[i].in.body).toStrictEqual(bodyCases[i].out);
			}
		});
	}

/*
	objectIdParams: [],
	processThreadIdParam: false,
	processDateParam
*/
	const paramCases = [
		{
			in: { options: { objectIdParams: ['test'] }, params: { test: 'lol' } },
			out: 'error',
		},
		{
			in: { options: { objectIdParams: ['test'] }, params: { test: 'aaaaaaaaaaaaaaaaaaaaaaaa' } },
			out: { test: ObjectId('aaaaaaaaaaaaaaaaaaaaaaaa') },
		},
		{
			in: { options: { processThreadIdParam: true }, params: { id: '123' } },
			out: { id: 123 },
		},
		{
			in: { options: { processThreadIdParam: true }, params: { id: null } },
			out: { id: null },
		},
		{
			in: { options: { processThreadIdParam: true }, params: { id: '' } },
			out: { id: null },
		},
		{
			in: { options: { processThreadIdParam: true }, params: { id: 'x' } },
			out: { id: null },
		},
	];

	for(let i in paramCases) {
		test(`${i} should output ${paramCases[i].out} for an input of ${paramCases[i].in}`, () => {
			const converter = paramConverter(paramCases[i].in.options);
			if (paramCases[i].out === 'error') {
				expect(() => {
					converter({ params: paramCases[i].in.params }, {locals:{}}, noop);
				}).toThrow();
			} else {
				converter({ params: paramCases[i].in.params }, {locals:{}}, noop);
				expect(paramCases[i].in.params).toStrictEqual(paramCases[i].out);
			}
		});
	}

	const dateCases = [
		{
			in: { options: { processDateParam: true }, params: { date: '01-01-2069' } },
			out: { date: { date: new Date(Date.UTC(2069, 0, 1, 0, 0, 0, 0)), month: 0, day: 1, year: 2069 } },
		},
		{
			in: { options: { processDateParam: true }, params: { date: null } },
			out: {},
		},
		{
			in: { options: { processDateParam: true }, params: { date: '' } },
			out: { date: null },
		},
		{
			in: { options: { processDateParam: true }, params: { date: 'somebullshit' } },
			out: { date: null },
		},
	];

	for(let i in dateCases) {
		test(`${i} should output ${dateCases[i].out} for an input of ${dateCases[i].in}`, () => {
			const converter = paramConverter(dateCases[i].in.options);
			const locals = {locals:{}};
			converter({ params: dateCases[i].in.params }, locals, noop);
			expect(locals.locals).toStrictEqual(dateCases[i].out);
		});
	}

});
