const { getSecureTrip, getInsecureTrip } = require('./tripcode.js');

describe('getSecureTrip() - "secure" tripcodes', () => {
	const cases = [
		{ in: '' },
		{ in: null },
		{ in: '13245' },
		{ in: '1324512345123451234512345123451234512345' },
	];
	for (let i in cases) {
		test(`should not error for an input of ${cases[i].in}`, async () => {
			expect((await getSecureTrip(cases[i].in)));
		});
	}
});

describe('getInsecureTrip() - "insecure" tripcodes', () => {
	const cases = [
		{ in: '', out: '8NBuQ4l6uQ' },
		{ in: null, out: '8NBuQ4l6uQ' },
		{ in: '13245', out: 'VPkdFNhOGY' },
		{ in: '1324512345123451234512345123451234512345', out: '9ovLU2O1wk' },
	];
	for (let i in cases) {
		test(`should contain ${cases[i].out} for an input of ${cases[i].in}`, () => {
			expect(getInsecureTrip(cases[i].in)).toBe(cases[i].out);
		});
	}
});
